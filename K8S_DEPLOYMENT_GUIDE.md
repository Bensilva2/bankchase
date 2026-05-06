# Kubernetes Deployment Guide for BankChase

## Overview

This guide covers deploying BankChase to Kubernetes with Horizontal Pod Autoscaler (HPA) for automatic scaling. The deployment includes both frontend (Next.js) and backend (FastAPI) services.

## Prerequisites

- Kubernetes cluster 1.24+ (EKS, GKE, AKS, or self-hosted)
- `kubectl` CLI configured to access your cluster
- Docker images built and pushed to a registry:
  - `bankchase-backend:latest`
  - `bankchase-frontend:latest`
- NGINX Ingress Controller installed
- Cert-Manager installed for SSL/TLS

## Architecture

```
┌─────────────────────────────────────┐
│        Ingress (HTTPS)              │
│     (cert-manager + NGINX)          │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────────────┐
    │                     │
┌───▼──────────┐   ┌─────▼──────────┐
│  Frontend    │   │  Backend API   │
│  Service     │   │  Service       │
│  (port 80)   │   │  (port 80)     │
└───┬──────────┘   └─────┬──────────┘
    │                     │
┌───▼──────────────────┐  │
│Frontend Deployment   │  │
│ (2-8 replicas)       │  │
│ ├─ Pod 1             │  │
│ ├─ Pod 2             │  │
│ └─ Pod N             │  │
└──────────────────────┘  │
                          │
                   ┌──────▼──────────────┐
                   │Backend Deployment   │
                   │ (3-10 replicas)     │
                   │ ├─ Pod 1            │
                   │ ├─ Pod 2            │
                   │ ├─ Pod 3            │
                   │ └─ Pod N            │
                   └─────────────────────┘
```

## Deployment Steps

### Step 1: Prepare Docker Images

```bash
# Build backend image
docker build -f Dockerfile -t bankchase-backend:latest .
docker tag bankchase-backend:latest your-registry/bankchase-backend:latest
docker push your-registry/bankchase-backend:latest

# Build frontend image
docker build -f Dockerfile.frontend -t bankchase-frontend:latest .
docker tag bankchase-frontend:latest your-registry/bankchase-frontend:latest
docker push your-registry/bankchase-frontend:latest
```

### Step 2: Update K8s Manifests

Update the following files with your configuration:

1. **`k8s/01-configmap.yaml`**
   - Set `NEXT_PUBLIC_API_URL` to your backend API endpoint
   - Set `NEXT_PUBLIC_APP_URL` to your frontend URL
   - Adjust `CORS_ORIGINS` for your domain

2. **`k8s/02-secrets.yaml`**
   - Replace all `your-*-here` values with actual secrets
   - Use `kubectl create secret` for sensitive data instead of committing

3. **`k8s/03-backend-deployment.yaml`** and **`k8s/06-frontend-deployment.yaml`**
   - Update image references to your registry
   - Adjust resource requests/limits if needed

4. **`k8s/09-ingress.yaml`**
   - Replace `bankchase.example.com` with your domain
   - Update `api.bankchase.example.com` with your API domain

### Step 3: Deploy to Kubernetes

```bash
# Create namespace and deploy manifests in order
kubectl apply -f k8s/00-namespace.yaml

# Create secrets (preferably use sealed-secrets or external-secrets in production)
kubectl apply -f k8s/02-secrets.yaml

# Deploy configuration
kubectl apply -f k8s/01-configmap.yaml

# Deploy services and deployments
kubectl apply -f k8s/03-backend-deployment.yaml
kubectl apply -f k8s/04-backend-service.yaml
kubectl apply -f k8s/06-frontend-deployment.yaml
kubectl apply -f k8s/07-frontend-service.yaml

# Deploy RBAC and network policies
kubectl apply -f k8s/10-rbac.yaml
kubectl apply -f k8s/11-network-policy.yaml

# Deploy HPAs (requires metrics-server)
kubectl apply -f k8s/05-backend-hpa.yaml
kubectl apply -f k8s/08-frontend-hpa.yaml

# Deploy ingress (requires NGINX controller)
kubectl apply -f k8s/09-ingress.yaml
```

Or apply all at once:
```bash
kubectl apply -f k8s/
```

### Step 4: Install Required Controllers

#### NGINX Ingress Controller
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

#### Cert-Manager (for SSL/TLS)
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - << EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

#### Metrics Server (for HPA to work)
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Step 5: Verify Deployment

```bash
# Check namespace
kubectl get namespace bankchase

# Check pods
kubectl get pods -n bankchase

# Check services
kubectl get svc -n bankchase

# Check deployments
kubectl get deployment -n bankchase

# Check HPA status
kubectl get hpa -n bankchase
kubectl describe hpa bankchase-backend-hpa -n bankchase

# Check ingress
kubectl get ingress -n bankchase
kubectl describe ingress bankchase-ingress -n bankchase

# View logs
kubectl logs -n bankchase -l app=bankchase-backend -f
kubectl logs -n bankchase -l app=bankchase-frontend -f
```

## HPA Configuration Details

### Backend HPA
- **Min Replicas**: 3
- **Max Replicas**: 10
- **Scale Up**: CPU > 70% OR Memory > 80%
- **Scale Down**: CPU < 70% AND Memory < 80% (300s stability window)
- **Behavior**: Double replicas on scale up (100% increase), reduce by 50% on scale down

### Frontend HPA
- **Min Replicas**: 2
- **Max Replicas**: 8
- **Scale Up**: CPU > 60% OR Memory > 75%
- **Scale Down**: CPU < 60% AND Memory < 75% (300s stability window)

## Monitoring & Debugging

### Check HPA Metrics
```bash
# Get current HPA status
kubectl get hpa bankchase-backend-hpa -n bankchase

# Watch HPA in real-time
kubectl get hpa bankchase-backend-hpa -n bankchase -w

# View detailed HPA events
kubectl describe hpa bankchase-backend-hpa -n bankchase
```

### Scale Manually (override HPA)
```bash
# Scale to specific number of replicas
kubectl scale deployment bankchase-backend -n bankchase --replicas=5

# Note: HPA will resume control after this
```

### View Resource Usage
```bash
# Get current resource usage
kubectl top nodes
kubectl top pods -n bankchase

# Watch resource usage
kubectl top pods -n bankchase -w
```

### Debug Pods
```bash
# Get pod details
kubectl describe pod <pod-name> -n bankchase

# Execute command in pod
kubectl exec -it <pod-name> -n bankchase -- /bin/bash

# Stream logs
kubectl logs -f <pod-name> -n bankchase

# Previous logs (if pod crashed)
kubectl logs -p <pod-name> -n bankchase
```

## Security Best Practices

### 1. Use Sealed Secrets or External Secrets
Instead of storing secrets in `k8s/02-secrets.yaml`, use:

**Option A: Sealed Secrets**
```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml -n kube-system

# Encrypt secret
echo -n "your-secret-value" | kubectl create secret generic bankchase-secrets \
  --dry-run=client \
  --from-file=key=/dev/stdin \
  -n bankchase \
  -o yaml | kubeseal -f - > sealed-secret.yaml

# Apply sealed secret
kubectl apply -f sealed-secret.yaml
```

**Option B: External Secrets Operator**
```bash
# Install external-secrets
helm repo add external-secrets https://external-secrets.github.io/external-secrets
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace

# Create SecretStore pointing to AWS Secrets Manager, HashiCorp Vault, etc.
```

### 2. Use Network Policies
Network policies are already configured in `k8s/11-network-policy.yaml`. They restrict:
- Frontend can only reach backend
- Backend can reach PostgreSQL and external services
- Only ingress controller can reach frontend/backend

### 3. Pod Security Standards
```bash
# Enforce restricted pod security standards
kubectl label namespace bankchase pod-security.kubernetes.io/enforce=restricted

# Audit violations
kubectl label namespace bankchase pod-security.kubernetes.io/audit=restricted
```

### 4. Image Scanning
Enable image scanning in your registry (ECR, GCR, ACR) for vulnerability detection.

## Production Checklist

- [ ] Update all `example.com` references to production domain
- [ ] Set strong JWT_SECRET and SETUP_TOKEN in secrets
- [ ] Configure database URL and credentials
- [ ] Set up proper log aggregation (ELK, Loki, etc.)
- [ ] Enable pod disruption budgets for zero-downtime deployments
- [ ] Set up monitoring and alerting (Prometheus + Grafana)
- [ ] Configure backup strategy for database
- [ ] Test disaster recovery procedures
- [ ] Set up CI/CD pipeline for automated deployments
- [ ] Enable audit logging
- [ ] Configure resource quotas per namespace
- [ ] Set up pod security policies
- [ ] Enable RBAC with least privilege

## Upgrading

### Rolling Update
Deployments are configured with `RollingUpdate` strategy:
- `maxSurge: 1` - Allow 1 extra pod during update
- `maxUnavailable: 0` - Keep all pods available

```bash
# Update image
kubectl set image deployment/bankchase-backend \
  backend=your-registry/bankchase-backend:v2.0.0 \
  -n bankchase

# Watch rollout
kubectl rollout status deployment/bankchase-backend -n bankchase

# Rollback if needed
kubectl rollout undo deployment/bankchase-backend -n bankchase
```

## Cost Optimization

1. Use Spot Instances for non-critical workloads
2. Adjust resource requests to avoid over-provisioning
3. Use node affinity to bin-pack pods
4. Enable cluster autoscaler to scale down unused nodes
5. Use PodDisruptionBudgets to allow graceful evictions

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n bankchase
kubectl logs <pod-name> -n bankchase
```

### HPA not scaling
```bash
# Check if metrics-server is running
kubectl get deployment metrics-server -n kube-system

# Check metrics
kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes
```

### Ingress not working
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress status
kubectl describe ingress bankchase-ingress -n bankchase
```

## Support & Documentation

- Kubernetes Official Docs: https://kubernetes.io/docs/
- NGINX Ingress: https://kubernetes.github.io/ingress-nginx/
- Cert-Manager: https://cert-manager.io/docs/
- Metrics Server: https://github.com/kubernetes-sigs/metrics-server
