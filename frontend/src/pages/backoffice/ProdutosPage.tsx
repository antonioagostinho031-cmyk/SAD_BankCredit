import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, Eye, Edit, Trash2 } from 'lucide-react'
import { productsService } from '../../services/products.service'
import { Card, CardHeader, CardContent } from '../../components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { usePermissions } from '../../hooks/usePermissions'
import { formatCurrency } from '../../lib/utils'
import { ProductFormModal } from '../../components/backoffice/ProductFormModal'
import { ProductFTIModal } from '../../components/backoffice/ProductFTIModal'

interface CreditProduct {
  id: string
  name: string
  code: string
  description: string | null
  category: 'pessoal' | 'habitacao' | 'automovel' | 'consolidacao' | 'empresarial'
  min_amount: number
  max_amount: number
  min_term_months: number
  max_term_months: number
  base_interest_rate: number
  min_interest_rate: number
  max_interest_rate: number
  min_income: number | null
  max_age: number | null
  min_age: number
  requires_guarantor: boolean
  requires_collateral: boolean
  opening_fee_percent: number
  opening_fee_fixed: number
  management_fee_annual: number
  early_payment_fee: number
  active: boolean
  priority_order: number
  grace_period_months?: number
  processing_fee_percentage?: number
  min_credit_score?: number
  max_ltv_ratio?: number
  collateral_types?: string[]
  required_documents?: string[]
  is_active?: boolean
  created_at: string
  updated_at: string
}

const categoryLabels: Record<string, string> = {
  pessoal: 'Crédito Pessoal',
  habitacao: 'Crédito Habitação',
  automovel: 'Crédito Automóvel',
  consolidacao: 'Crédito Consolidado',
  empresarial: 'Crédito Empresarial',
}

export default function ProdutosPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showFormModal, setShowFormModal] = useState(false)
  const [showFTIModal, setShowFTIModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CreditProduct | null>(null)
  const [editingProduct, setEditingProduct] = useState<CreditProduct | null>(null)

  const { canCreateProduct, canUpdateProduct, canDeleteProduct } = usePermissions()

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getAll(),
  })

  const filteredProducts = products.filter((product: CreditProduct) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.code.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCreate = () => {
    setEditingProduct(null)
    setShowFormModal(true)
  }

  const handleEdit = (product: CreditProduct) => {
    setEditingProduct(product)
    setShowFormModal(true)
  }

  const handleViewFTI = (product: CreditProduct) => {
    setSelectedProduct(product)
    setShowFTIModal(true)
  }

  const handleFormSuccess = async (productData: Partial<CreditProduct>) => {
    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct.id, data: productData })
    } else {
      await createMutation.mutateAsync(productData)
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: Partial<CreditProduct>) => productsService.create(data),
    onSuccess: () => {
      refetch()
      setShowFormModal(false)
      setEditingProduct(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreditProduct> }) => 
      productsService.update(id, data),
    onSuccess: () => {
      refetch()
      setShowFormModal(false)
      setEditingProduct(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (product: CreditProduct) => {
    if (window.confirm(`Tem certeza que deseja eliminar o produto "${product.name}"?`)) {
      await deleteMutation.mutateAsync(product.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos de Crédito</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestão de produtos de crédito e respectivas FTIs (Fichas Técnicas de Informação)
          </p>
        </div>
        {canCreateProduct() && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Pesquisar por nome ou cdigo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">Todas as Categorias</option>
                <option value="pessoal">Crédito Pessoal</option>
                <option value="habitacao">Crédito Habitação</option>
                <option value="automovel">Crédito Automóvel</option>
                <option value="consolidacao">Crédito Consolidado</option>
                <option value="empresarial">Crédito Empresarial</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-gray-500">A carregar produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cdigo</TableHead>
                    <TableHead>Nome do Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Montante</TableHead>
                    <TableHead className="text-right">Prazo</TableHead>
                    <TableHead className="text-right">TAN Base</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Aces</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: CreditProduct) => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{product.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                          {categoryLabels[product.category]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          <p className="text-gray-600">{formatCurrency(product.min_amount)}</p>
                          <p className="text-xs text-gray-400">at {formatCurrency(product.max_amount)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          <p className="text-gray-900">{product.min_term_months} - {product.max_term_months}</p>
                          <p className="text-xs text-gray-400">meses</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">{product.base_interest_rate.toFixed(2)}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          product.active
                            ? 'bg-[#0097A9]/10 text-[#0097A9]'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewFTI(product)}
                            className="rounded-md p-1.5 text-[#0097A9] hover:bg-[#0097A9]/10 transition-colors"
                            title="Ver FTI"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canUpdateProduct() && (
                            <button
                              onClick={() => handleEdit(product)}
                              className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDeleteProduct() && (
                            <button
                              onClick={() => handleDelete(product)}
                              className="rounded-md p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showFormModal && (
        <ProductFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false)
            setEditingProduct(null)
          }}
          onSubmit={handleFormSuccess}
          product={editingProduct || undefined}
          mode={editingProduct ? 'edit' : 'create'}
        />
      )}

      {showFTIModal && selectedProduct && (
        <ProductFTIModal
          isOpen={showFTIModal}
          onClose={() => {
            setShowFTIModal(false)
            setSelectedProduct(null)
          }}
          productId={selectedProduct.id}
        />
      )}
    </div>
  )
}

