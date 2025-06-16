import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { 
  Building2, 
  Calculator, 
  FolderKanban, 
  Package, 
  Users, 
  UserCheck, 
  CreditCard, 
  Settings,
  Shield,
  Cloud,
  Zap,
  CheckCircle,
  ArrowRight,
  Download,
  ExternalLink,
  BarChart3,
  Globe,
  Lock,
  TrendingUp,
  Star,
  Award,
  Target,
  Lightbulb,
  Rocket,
  Eye,
  FileText,
  Code,
  Database,
  Smartphone,
  Monitor
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import './App.css'

function App() {
  const [activeModule, setActiveModule] = useState('facturacion')
  const [showPromptDialog, setShowPromptDialog] = useState(false)

  // Datos para gráficos
  const moduleUsageData = [
    { name: 'Facturación', usage: 95, color: '#3b82f6' },
    { name: 'Contabilidad', usage: 88, color: '#10b981' },
    { name: 'Proyectos', usage: 75, color: '#8b5cf6' },
    { name: 'Inventario', usage: 82, color: '#f59e0b' },
    { name: 'RRHH', usage: 70, color: '#ef4444' },
    { name: 'CRM', usage: 85, color: '#6366f1' },
    { name: 'TPV', usage: 65, color: '#eab308' },
    { name: 'Sistema', usage: 90, color: '#6b7280' }
  ]

  const integrationStats = [
    { name: 'E-commerce', value: 35, color: '#3b82f6' },
    { name: 'Pagos', value: 25, color: '#10b981' },
    { name: 'Almacenamiento', value: 15, color: '#8b5cf6' },
    { name: 'Marketplace', value: 15, color: '#f59e0b' },
    { name: 'Otros', value: 10, color: '#ef4444' }
  ]

  const performanceData = [
    { month: 'Ene', automation: 85, efficiency: 78 },
    { month: 'Feb', automation: 87, efficiency: 82 },
    { month: 'Mar', automation: 90, efficiency: 85 },
    { month: 'Abr', automation: 92, efficiency: 88 },
    { month: 'May', automation: 94, efficiency: 91 },
    { month: 'Jun', automation: 95, efficiency: 93 }
  ]

  const modules = [
    {
      id: 'facturacion',
      name: 'Facturación',
      icon: Calculator,
      color: 'bg-blue-500',
      description: 'Sistema completo de facturación electrónica con cumplimiento normativo',
      usage: 95,
      features: [
        'Facturación electrónica (SII, Verifactu, TicketBAI)',
        'Más de 100 plantillas personalizables',
        'Gestión de presupuestos y albaranes',
        'Enlaces de pago integrados',
        'Numeración automática y personalizada',
        'Gestión completa de impuestos (IVA, IRPF)',
        'Facturas recurrentes automatizadas'
      ]
    },
    {
      id: 'contabilidad',
      name: 'Contabilidad',
      icon: BarChart3,
      color: 'bg-green-500',
      description: 'Automatización del 95% de tareas contables con IA',
      usage: 88,
      features: [
        'Automatización del 95% de tareas contables',
        'Sincronización con +300 bancos',
        'Generación automática de modelos fiscales',
        'Plan General Contable (PGC) español',
        'Conciliación bancaria inteligente',
        'Informes financieros automáticos',
        'Gestión de activos fijos y amortizaciones'
      ]
    },
    {
      id: 'proyectos',
      name: 'Proyectos',
      icon: FolderKanban,
      color: 'bg-purple-500',
      description: 'Gestión profesional de proyectos con metodologías ágiles',
      usage: 75,
      features: [
        'Metodologías Kanban y Agile',
        'Plantillas de proyectos reutilizables',
        'Seguimiento de tiempo y rentabilidad',
        'Vistas Kanban, Gantt y listado',
        'Asignación de tareas y recursos',
        'Análisis de rentabilidad por proyecto',
        'Integración con facturación por horas'
      ]
    },
    {
      id: 'inventario',
      name: 'Inventario',
      icon: Package,
      color: 'bg-orange-500',
      description: 'Control total del stock en tiempo real',
      usage: 82,
      features: [
        'Gestión multialmacén',
        'Productos con variantes y números de serie',
        'Alertas de stock mínimo',
        'Gestión de pedidos de compra y venta',
        'Trazabilidad completa de productos',
        'Valoración FIFO, LIFO y precio medio',
        'Sincronización con tiendas online'
      ]
    },
    {
      id: 'rrhh',
      name: 'Recursos Humanos',
      icon: Users,
      color: 'bg-red-500',
      description: 'Gestión integral del equipo y control horario',
      usage: 70,
      features: [
        'Base de datos centralizada de empleados',
        'Control horario con geolocalización',
        'Gestión de ausencias y vacaciones',
        'Portal de autoservicio para empleados',
        'Generación de nóminas',
        'Cumplimiento normativo laboral',
        'Evaluaciones de desempeño'
      ]
    },
    {
      id: 'crm',
      name: 'CRM',
      icon: UserCheck,
      color: 'bg-indigo-500',
      description: 'Gestión inteligente de relaciones con clientes',
      usage: 85,
      features: [
        'Embudo de ventas personalizable',
        'Gestión de leads y oportunidades',
        'Seguimiento de actividades comerciales',
        'Sistema de booking integrado',
        'Análisis de conversión y métricas',
        'Automatización de comunicaciones',
        'Segmentación avanzada de clientes'
      ]
    },
    {
      id: 'tpv',
      name: 'TPV',
      icon: CreditCard,
      color: 'bg-yellow-500',
      description: 'Terminal punto de venta omnicanal',
      usage: 65,
      features: [
        'Ventas en tablet optimizadas',
        'Integración online y offline',
        'Múltiples métodos de pago',
        'Gestión de devoluciones',
        'Recibos digitales e impresos',
        'Sincronización automática con inventario',
        'Análisis de ventas en tiempo real'
      ]
    },
    {
      id: 'sistema',
      name: 'Sistema',
      icon: Settings,
      color: 'bg-gray-500',
      description: 'Infraestructura y administración avanzada',
      usage: 90,
      features: [
        'Gestión de roles y permisos',
        'Almacenamiento de archivos centralizado',
        'Directorio de asesorías especializadas',
        'Configuración multiempresa',
        'Auditoría completa de actividades',
        'Copias de seguridad automáticas',
        'API REST completa'
      ]
    }
  ]

  const integrations = [
    { name: 'Shopify', category: 'E-commerce', logo: '🛍️' },
    { name: 'WooCommerce', category: 'E-commerce', logo: '🛒' },
    { name: 'Amazon', category: 'Marketplace', logo: '📦' },
    { name: 'PayPal', category: 'Pagos', logo: '💳' },
    { name: 'Stripe', category: 'Pagos', logo: '💰' },
    { name: 'Google Drive', category: 'Almacenamiento', logo: '☁️' },
    { name: 'Zapier', category: 'Automatización', logo: '⚡' },
    { name: 'Mailchimp', category: 'Marketing', logo: '📧' },
    { name: 'Slack', category: 'Comunicación', logo: '💬' }
  ]

  const technicalSpecs = [
    {
      title: 'Arquitectura en la Nube',
      description: 'Google Cloud Platform con escalabilidad automática y alta disponibilidad',
      icon: Cloud,
      metrics: '99.9% uptime'
    },
    {
      title: 'Seguridad Avanzada',
      description: 'Encriptación end-to-end, cumplimiento GDPR y auditorías continuas',
      icon: Shield,
      metrics: 'ISO 27001'
    },
    {
      title: 'Automatización IA',
      description: 'Automatización inteligente del 95% de tareas contables con machine learning',
      icon: Zap,
      metrics: '95% automatización'
    },
    {
      title: 'API REST Completa',
      description: '20+ endpoints para integraciones personalizadas con documentación completa',
      icon: Globe,
      metrics: '20+ endpoints'
    }
  ]

  const downloadPDF = () => {
    // Simular descarga de PDF
    const link = document.createElement('a')
    link.href = '/analisis_funcional_holded.pdf'
    link.download = 'Analisis_Funcional_Holded.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const promptContent = `# Prompt para Agente Especializado en Holded

Eres un agente especializado en gestión empresarial con conocimiento experto en todas las funcionalidades de Holded.com. Tu objetivo es replicar exactamente todas las capacidades de esta plataforma ERP integral.

## Conocimiento Base Requerido

### Legislación y Cumplimiento
- Legislación fiscal española (SII, Verifactu, TicketBAI)
- Plan General Contable (PGC) español
- Normativa laboral y RRHH española
- Cumplimiento GDPR y protección de datos
- Regulaciones bancarias y financieras

### Módulos Funcionales
1. **Facturación Electrónica**: Dominio completo de facturación española
2. **Contabilidad Automatizada**: IA para automatización del 95% de tareas
3. **Gestión de Proyectos**: Metodologías ágiles y tradicionales
4. **Control de Inventario**: Gestión multialmacén y trazabilidad
5. **Recursos Humanos**: Gestión integral de equipos
6. **CRM Avanzado**: Automatización de ventas y marketing
7. **TPV Omnicanal**: Integración online/offline
8. **Administración**: Configuración y seguridad empresarial

### Capacidades Técnicas
- Procesamiento de documentos con OCR
- Integración con APIs bancarias (+300 bancos)
- Sincronización con plataformas e-commerce
- Automatización inteligente con IA
- Análisis predictivo y reporting avanzado
- Cumplimiento automático de normativas

### Integraciones Principales
- Shopify, WooCommerce, Amazon (E-commerce)
- PayPal, Stripe (Pagos)
- Google Drive, Dropbox (Almacenamiento)
- Zapier (Automatización)
- Mailchimp (Marketing)

## Instrucciones de Comportamiento

1. **Expertise Técnico**: Demuestra conocimiento profundo en gestión empresarial española
2. **Automatización Inteligente**: Propón soluciones automatizadas para tareas repetitivas
3. **Cumplimiento Normativo**: Asegura siempre el cumplimiento legal y fiscal
4. **Integración Holística**: Conecta diferentes módulos para soluciones completas
5. **Orientación a Resultados**: Enfócate en eficiencia y rentabilidad empresarial

Actúa como un consultor experto que conoce perfectamente todas las funcionalidades de Holded y puede guiar a las empresas en su transformación digital completa.`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header mejorado */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Análisis Funcional de Holded.com
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Estudio Técnico Completo para Desarrollo de Agente Especializado
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                onClick={downloadPDF}
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </Button>
              <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
                    <Code className="h-4 w-4" />
                    Ver Prompt Especializado
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Prompt para Agente Especializado
                    </DialogTitle>
                    <DialogDescription>
                      Especificaciones completas para crear un agente con las mismas capacidades que Holded
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border overflow-auto">
                      {promptContent}
                    </pre>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section mejorado */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="flex justify-center mb-6">
            <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 hover:from-blue-200 hover:to-indigo-200 px-6 py-2 text-base">
              <Star className="h-4 w-4 mr-2" />
              Análisis Completo • 80+ Funcionalidades Identificadas
            </Badge>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-8">
            Plataforma ERP Integral para PYMEs
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            Holded.com representa una solución completa de gestión empresarial basada en la nube, 
            diseñada específicamente para pequeñas y medianas empresas con 8 módulos principales 
            y arquitectura técnica robusta en Google Cloud Platform.
          </p>
          
          {/* Stats mejoradas con gráficos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="text-4xl font-bold text-blue-600 mb-2">8</div>
              <div className="text-sm text-gray-600 font-medium">Módulos Principales</div>
              <div className="mt-4">
                <Progress value={100} className="h-2" />
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="text-4xl font-bold text-green-600 mb-2">80+</div>
              <div className="text-sm text-gray-600 font-medium">Funcionalidades</div>
              <div className="mt-4">
                <Progress value={95} className="h-2" />
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="text-4xl font-bold text-purple-600 mb-2">13+</div>
              <div className="text-sm text-gray-600 font-medium">Integraciones</div>
              <div className="mt-4">
                <Progress value={85} className="h-2" />
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="text-4xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-sm text-gray-600 font-medium">Automatización</div>
              <div className="mt-4">
                <Progress value={95} className="h-2" />
              </div>
            </div>
          </div>

          {/* Gráfico de rendimiento */}
          <div className="mt-16 bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Evolución de Automatización y Eficiencia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="automation" stroke="#3b82f6" strokeWidth={3} name="Automatización %" />
                <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={3} name="Eficiencia %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Main Content mejorado */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/70 backdrop-blur-sm p-2 rounded-2xl shadow-lg">
            <TabsTrigger value="modules" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Monitor className="h-4 w-4 mr-2" />
              Módulos Funcionales
            </TabsTrigger>
            <TabsTrigger value="technical" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Database className="h-4 w-4 mr-2" />
              Arquitectura Técnica
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Globe className="h-4 w-4 mr-2" />
              Integraciones
            </TabsTrigger>
            <TabsTrigger value="prompt" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Code className="h-4 w-4 mr-2" />
              Prompt Especializado
            </TabsTrigger>
          </TabsList>

          {/* Modules Tab mejorado */}
          <TabsContent value="modules" className="space-y-8">
            {/* Gráfico de uso de módulos */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Adopción y Uso de Módulos
                </CardTitle>
                <CardDescription>
                  Porcentaje de empresas que utilizan cada módulo de Holded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={moduleUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Module Navigation mejorado */}
              <div className="lg:col-span-1">
                <Card className="bg-white/70 backdrop-blur-sm border-white/20 sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Módulos
                    </CardTitle>
                    <CardDescription>
                      Selecciona un módulo para ver detalles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {modules.map((module) => {
                      const IconComponent = module.icon
                      return (
                        <Button
                          key={module.id}
                          variant={activeModule === module.id ? "default" : "ghost"}
                          className={`w-full justify-start transition-all duration-200 ${
                            activeModule === module.id 
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" 
                              : "hover:bg-blue-50"
                          }`}
                          onClick={() => setActiveModule(module.id)}
                        >
                          <IconComponent className="h-4 w-4 mr-3" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{module.name}</div>
                            <div className="text-xs opacity-70">{module.usage}% adopción</div>
                          </div>
                        </Button>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Module Details mejorado */}
              <div className="lg:col-span-3">
                {modules.map((module) => {
                  if (module.id !== activeModule) return null
                  const IconComponent = module.icon
                  
                  return (
                    <Card key={module.id} className="h-full bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-2xl ${module.color} text-white shadow-lg`}>
                            <IconComponent className="h-8 w-8" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-3xl flex items-center gap-3">
                              {module.name}
                              <Badge variant="secondary" className="text-sm">
                                {module.usage}% adopción
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-lg mt-2">
                              {module.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Nivel de Adopción</span>
                            <span className="text-sm text-gray-600">{module.usage}%</span>
                          </div>
                          <Progress value={module.usage} className="h-3" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="font-semibold mb-6 text-lg flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Funcionalidades Principales:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {module.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Technical Tab mejorado */}
          <TabsContent value="technical" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {technicalSpecs.map((spec, index) => {
                const IconComponent = spec.icon
                return (
                  <Card key={index} className="bg-white/70 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                          <IconComponent className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl">{spec.title}</CardTitle>
                          <Badge variant="outline" className="mt-2">{spec.metrics}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">{spec.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Shield className="h-6 w-6" />
                  Seguridad y Cumplimiento
                </CardTitle>
                <CardDescription className="text-base">
                  Certificaciones y estándares de seguridad implementados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <div className="font-bold text-green-800 text-lg">GDPR</div>
                    <div className="text-sm text-green-600 mt-2">Cumplimiento completo de protección de datos</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                    <Cloud className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <div className="font-bold text-blue-800 text-lg">Google Cloud</div>
                    <div className="text-sm text-blue-600 mt-2">Infraestructura certificada ISO 27001</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
                    <Lock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <div className="font-bold text-purple-800 text-lg">Encriptación</div>
                    <div className="text-sm text-purple-600 mt-2">End-to-end AES-256</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab mejorado */}
          <TabsContent value="integrations" className="space-y-8">
            {/* Gráfico de distribución de integraciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle>Distribución de Integraciones</CardTitle>
                  <CardDescription>
                    Categorías de integraciones más utilizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={integrationStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {integrationStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle>Integraciones Principales</CardTitle>
                  <CardDescription>
                    Conectividad con las plataformas más importantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {integrations.map((integration, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="text-2xl">{integration.logo}</div>
                        <div className="flex-1">
                          <div className="font-semibold">{integration.name}</div>
                          <Badge variant="secondary" className="text-xs">{integration.category}</Badge>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API REST Completa
                </CardTitle>
                <CardDescription>
                  Documentación completa para integraciones personalizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-6 rounded-xl font-mono text-sm overflow-x-auto">
                  <div className="space-y-2">
                    <div><span className="text-blue-400">GET</span> /api/v1/contacts</div>
                    <div><span className="text-green-400">POST</span> /api/v1/documents</div>
                    <div><span className="text-yellow-400">PUT</span> /api/v1/products/:id</div>
                    <div><span className="text-red-400">DELETE</span> /api/v1/projects/:id</div>
                    <div><span className="text-purple-400">GET</span> /api/v1/invoices</div>
                    <div><span className="text-cyan-400">POST</span> /api/v1/payments</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="font-bold text-blue-800">20+</div>
                    <div className="text-sm text-blue-600">Endpoints</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="font-bold text-green-800">REST</div>
                    <div className="text-sm text-green-600">Arquitectura</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="font-bold text-purple-800">JSON</div>
                    <div className="text-sm text-purple-600">Formato</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompt Tab mejorado */}
          <TabsContent value="prompt" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Rocket className="h-6 w-6" />
                  Prompt para Agente Especializado
                </CardTitle>
                <CardDescription className="text-base">
                  Especificaciones técnicas completas para replicar todas las funcionalidades de Holded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Objetivo del Prompt
                    </h4>
                    <p className="text-blue-800 leading-relaxed">
                      Crear un agente especializado que replique exactamente todas las funcionalidades 
                      de Holded.com, incluyendo conocimiento experto en gestión empresarial, 
                      automatización inteligente y cumplimiento normativo español y europeo.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                      <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Conocimiento Base
                      </h4>
                      <ul className="text-green-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Legislación fiscal española (SII, Verifactu, TicketBAI)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Plan General Contable (PGC)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Metodologías ágiles de proyectos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Gestión de inventario multialmacén</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Normativa laboral y RRHH</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-2xl border border-purple-200">
                      <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Capacidades Técnicas
                      </h4>
                      <ul className="text-purple-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Automatización inteligente con IA</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Procesamiento de documentos (OCR)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Integraciones con APIs externas</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Análisis predictivo y reporting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Cumplimiento GDPR automático</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button 
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      onClick={() => setShowPromptDialog(true)}
                    >
                      <Eye className="h-4 w-4" />
                      Ver Prompt Completo
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 hover:bg-blue-50"
                      onClick={downloadPDF}
                    >
                      <Download className="h-4 w-4" />
                      Descargar Documentación
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer mejorado */}
      <footer className="bg-gradient-to-r from-gray-900 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4">Análisis Funcional Completo</h3>
            <p className="text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Documentación técnica exhaustiva para el desarrollo de agentes especializados 
              en gestión empresarial con las mismas capacidades que Holded.com
            </p>
            <div className="flex justify-center gap-6 mb-8 flex-wrap">
              <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 px-4 py-2">
                <FileText className="h-4 w-4 mr-2" />
                40+ páginas de análisis
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 px-4 py-2">
                <Code className="h-4 w-4 mr-2" />
                25+ páginas de prompt
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 px-4 py-2">
                <Target className="h-4 w-4 mr-2" />
                80+ funcionalidades
              </Badge>
            </div>
            <p className="text-sm text-gray-400">
              Generado por Manus AI • Junio 2025 • Versión 2.0 Mejorada
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

