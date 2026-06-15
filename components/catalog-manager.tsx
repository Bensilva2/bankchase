'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Package } from 'lucide-react'
import { generateMockCatalogs, generateMockProducts } from '@/lib/campaign-builder'

export function CatalogManager() {
  const [catalogs, setCatalogs] = useState(generateMockCatalogs())
  const [selectedCatalog, setSelectedCatalog] = useState(catalogs[0])
  const [isCreating, setIsCreating] = useState(false)

  const deleteCatalog = (id: string) => {
    setCatalogs(catalogs.filter(c => c.id !== id))
    if (selectedCatalog.id === id) {
      setSelectedCatalog(catalogs[0])
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Product Catalogs</h2>
          <p className="text-muted-foreground">Manage your product catalogs for dynamic ads</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Catalog
        </button>
      </div>

      {/* Create New Catalog */}
      {isCreating && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Create Catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Catalog Name</label>
              <input
                type="text"
                placeholder="e.g., Summer Collection"
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="Describe your product catalog..."
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Create Catalog
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Catalogs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catalogs List */}
        <div className="lg:col-span-1">
          <div className="space-y-2">
            {catalogs.map((catalog) => (
              <button
                key={catalog.id}
                onClick={() => setSelectedCatalog(catalog)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedCatalog.id === catalog.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{catalog.name}</p>
                    <p className="text-sm text-muted-foreground">{catalog.products.length} products</p>
                  </div>
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Details */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border h-full">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{selectedCatalog.name}</CardTitle>
                <CardDescription>{selectedCatalog.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCatalog(selectedCatalog.id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Products ({selectedCatalog.products.length})</h3>
                  <div className="space-y-3">
                    {selectedCatalog.products.map((product) => (
                      <div key={product.id} className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                        <div className="w-12 h-12 bg-primary/20 rounded flex items-center justify-center text-primary font-semibold flex-shrink-0">
                          {product.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold">${product.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{product.inventory} in stock</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  Add Products to Catalog
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
