#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REGISTRY="${DOCKER_REGISTRY:-your-registry}"
BACKEND_IMAGE="${REGISTRY}/bankchase-backend:latest"
FRONTEND_IMAGE="${REGISTRY}/bankchase-frontend:latest"
NAMESPACE="bankchase"
DOMAIN="${DOMAIN:-bankchase.example.com}"
API_DOMAIN="${API_DOMAIN:-api.bankchase.example.com}"

echo -e "${YELLOW}BankChase Kubernetes Deployment Script${NC}\n"

# Function to check command existence
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify prerequisites
echo "Checking prerequisites..."
for cmd in kubectl docker git; do
    if ! command_exists "$cmd"; then
        echo -e "${RED}Error: $cmd is not installed${NC}"
        exit 1
    fi
done
echo -e "${GREEN}Prerequisites OK${NC}\n"

# Build and push Docker images
echo "Building Docker images..."
docker build -f Dockerfile -t "$BACKEND_IMAGE" .
docker build -f Dockerfile.frontend -t "$FRONTEND_IMAGE" .

echo "Pushing images to registry..."
docker push "$BACKEND_IMAGE"
docker push "$FRONTEND_IMAGE"
echo -e "${GREEN}Images pushed successfully${NC}\n"

# Create namespace
echo "Creating Kubernetes namespace..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}Namespace created/updated${NC}\n"

# Update manifests with correct values
echo "Updating manifests with configuration..."
sed -i.bak "s|bankchase-backend:latest|$BACKEND_IMAGE|g" k8s/03-backend-deployment.yaml
sed -i.bak "s|bankchase-frontend:latest|$FRONTEND_IMAGE|g" k8s/06-frontend-deployment.yaml
sed -i.bak "s|bankchase.example.com|$DOMAIN|g" k8s/09-ingress.yaml
sed -i.bak "s|api.bankchase.example.com|$API_DOMAIN|g" k8s/09-ingress.yaml

# Deploy manifests
echo "Deploying to Kubernetes..."
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml
kubectl apply -f k8s/03-backend-deployment.yaml
kubectl apply -f k8s/04-backend-service.yaml
kubectl apply -f k8s/05-backend-hpa.yaml
kubectl apply -f k8s/06-frontend-deployment.yaml
kubectl apply -f k8s/07-frontend-service.yaml
kubectl apply -f k8s/08-frontend-hpa.yaml
kubectl apply -f k8s/09-ingress.yaml
kubectl apply -f k8s/10-rbac.yaml
kubectl apply -f k8s/11-network-policy.yaml

echo -e "${GREEN}Deployment submitted${NC}\n"

# Wait for rollout
echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/bankchase-backend -n "$NAMESPACE" --timeout=5m
kubectl rollout status deployment/bankchase-frontend -n "$NAMESPACE" --timeout=5m
echo -e "${GREEN}Deployments ready${NC}\n"

# Display status
echo "Deployment Status:"
echo "=================="
kubectl get all -n "$NAMESPACE"
echo ""
kubectl get hpa -n "$NAMESPACE"
echo ""
kubectl get ingress -n "$NAMESPACE"
echo ""

echo -e "${GREEN}Deployment complete!${NC}"
echo "Access your application at: https://$DOMAIN"
echo "API endpoint: https://$API_DOMAIN"
echo ""
echo "To monitor HPA:"
echo "  kubectl get hpa -n $NAMESPACE -w"
echo ""
echo "To view logs:"
echo "  kubectl logs -f -l app=bankchase-backend -n $NAMESPACE"
echo "  kubectl logs -f -l app=bankchase-frontend -n $NAMESPACE"

# Cleanup backup files
rm -f k8s/*.bak
