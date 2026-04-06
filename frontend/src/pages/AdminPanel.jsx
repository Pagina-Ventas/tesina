import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts'
import '../style/Admin.css'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Falta VITE_API_URL')
}

export function Inventario({ pedidos, confirmarPedidoAdmin, crearProducto, reponerProductoAdmin, editarProductoAdmin }) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [logs, setLogs] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [recargoMP, setRecargoMP] = useState(20)
    const [banners, setBanners] = useState([])
  const [nuevoBanner, setNuevoBanner] = useState({
    titulo: '',
    subtitulo: '',
    orden: 0,
    activo: 1,
    imagen: null
  })

  const [adminNombre, setAdminNombre] = useState('Administrador')
  const [adminIniciales, setAdminIniciales] = useState('AD')

  const [busqueda, setBusqueda] = useState('')
  const [vistaActiva, setVistaActiva] = useState('dashboard')

  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoProd, setNuevoProd] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    stock: '',
    stockMinimo: 5,
    descripcion: '',
    imagen: null
  })

  const [mostrarModalReponer, setMostrarModalReponer] = useState(false)
  const [productoAReponer, setProductoAReponer] = useState(null)
  const [cantidadReponer, setCantidadReponer] = useState(1)

  const [mostrarModalEditar, setMostrarModalEditar] = useState(false)
  const [prodEditar, setProdEditar] = useState(null)

  const [imagenesSecundarias, setImagenesSecundarias] = useState([])
  const [imagenesProductoActual, setImagenesProductoActual] = useState([])

  const [nuevaCategoria, setNuevaCategoria] = useState('')

  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false)
  const [pedidoDetalle, setPedidoDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const fechaActual = new Date()
  const [anioSeleccionado, setAnioSeleccionado] = useState(fechaActual.getFullYear())
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1)

  const token = localStorage.getItem('adminToken')

  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/productos`)
      const data = await res.json()
      setProductos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setProductos([])
    }
  }

  const cargarCategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categorias`)
      const data = await res.json()
      setCategorias(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setCategorias([])
    }
  }

  const cargarLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error cargando logs:', err)
      setLogs([])
    }
  }

  const cargarUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error cargando usuarios:', err)
      setUsuarios([])
    }
  }

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mercadopago/configuracion`)
      const data = await res.json()
      if (data && data.recargoMP !== undefined) {
        setRecargoMP(data.recargoMP)
      }
    } catch (err) {
      console.error('Error cargando configuracion:', err)
    }
  }

  const guardarConfiguracion = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mercadopago/configuracion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recargoMP })
      })
      if (res.ok) {
        alert('✅ Porcentaje de recargo actualizado correctamente.')
      } else {
        alert('❌ Error al guardar el recargo.')
      }
    } catch (error) {
      console.error(error)
      alert('Error de conexión')
    }
  }
    const cargarBanners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/banners/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setBanners(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error cargando banners:', err)
      setBanners([])
    }
  }

  const handleBannerInputChange = (e) => {
    const { name, value } = e.target
    setNuevoBanner(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBannerFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNuevoBanner(prev => ({
        ...prev,
        imagen: e.target.files[0]
      }))
    }
  }

  const crearBanner = async (e) => {
    e.preventDefault()

    if (!nuevoBanner.imagen) {
      alert('Seleccioná una imagen para el banner')
      return
    }

    try {
      const formData = new FormData()
      formData.append('titulo', nuevoBanner.titulo)
      formData.append('subtitulo', nuevoBanner.subtitulo)
      formData.append('orden', nuevoBanner.orden)
      formData.append('activo', nuevoBanner.activo)
      formData.append('imagen', nuevoBanner.imagen)

      const res = await fetch(`${API_URL}/api/banners`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo crear el banner')
      }

      alert('✅ Banner creado correctamente')

      setNuevoBanner({
        titulo: '',
        subtitulo: '',
        orden: 0,
        activo: 1,
        imagen: null
      })

      await cargarBanners()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Error creando banner')
    }
  }

  const cambiarEstadoBanner = async (banner) => {
    try {
      const formData = new FormData()
      formData.append('titulo', banner.titulo || '')
      formData.append('subtitulo', banner.subtitulo || '')
      formData.append('orden', banner.orden || 0)
      formData.append('activo', banner.activo ? 0 : 1)

      const res = await fetch(`${API_URL}/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo actualizar el banner')
      }

      await cargarBanners()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Error actualizando banner')
    }
  }

  const cambiarOrdenBanner = async (banner, nuevoOrden) => {
    try {
      const formData = new FormData()
      formData.append('titulo', banner.titulo || '')
      formData.append('subtitulo', banner.subtitulo || '')
      formData.append('orden', nuevoOrden)
      formData.append('activo', banner.activo ? 1 : 0)

      const res = await fetch(`${API_URL}/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo actualizar el orden')
      }

      await cargarBanners()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Error actualizando orden')
    }
  }

  const eliminarBanner = async (id) => {
    const ok = window.confirm('¿Eliminar este banner?')
    if (!ok) return

    try {
      const res = await fetch(`${API_URL}/api/banners/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo eliminar el banner')
      }

      alert('✅ Banner eliminado')
      await cargarBanners()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Error eliminando banner')
    }
  }

    useEffect(() => {
    cargarProductos()
    cargarCategorias()
    cargarLogs()
    cargarConfiguracion()
    cargarBanners()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarModal, mostrarModalEditar, pedidos])

  useEffect(() => {
  const usuarioGuardado = localStorage.getItem('usuarioData')

  if (usuarioGuardado) {
    try {
      const user = JSON.parse(usuarioGuardado)

      const nombreMostrar =
        user.nombre?.trim() ||
        user.username?.trim() ||
        'Administrador'

      setAdminNombre(nombreMostrar)

      const iniciales = nombreMostrar
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((palabra) => palabra[0].toUpperCase())
        .join('')

      setAdminIniciales(iniciales || 'AD')
    } catch (error) {
      console.error('Error leyendo usuarioData:', error)
    }
  }
}, [])

    const verDetallePedidoAdmin = async (id) => {
    setCargandoDetalle(true)
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      // 👇 AGREGÁ ESTO
      console.log('DETALLE PEDIDO:', data)

      if (res.ok) {
        setPedidoDetalle(data)
        setModalDetalleAbierto(true)
      } else {
        alert(data.message || 'No se pudo cargar el detalle del pedido')
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión al cargar detalle')
    } finally {
      setCargandoDetalle(false)
    }
  }

    const cambiarRolUsuarioAdmin = async (id, rolActual) => {
      const nuevoRol = rolActual === 'admin' ? 'cliente' : 'admin'
      const ok = window.confirm(`¿Seguro que quieres cambiar el rol a "${nuevoRol}"?`)
      if (!ok) return

      try {
        const res = await fetch(`${API_URL}/api/usuarios/${id}/rol`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ role: nuevoRol })
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'No se pudo cambiar el rol')
        }

        await cargarUsuarios()
        alert('✅ Rol actualizado correctamente')
      } catch (e) {
        console.error(e)
        alert(e?.message || 'Error cambiando rol')
      }
    }

  const cambiarEstadoUsuarioAdmin = async (id, activoActual) => {
    const nuevoEstado = !activoActual
    const ok = window.confirm(`¿Seguro que quieres ${nuevoEstado ? 'activar' : 'desactivar'} este usuario?`)
    if (!ok) return

    try {
      const res = await fetch(`${API_URL}/api/usuarios/${id}/activo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activo: nuevoEstado })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo cambiar el estado')
      }

      await cargarUsuarios()
      alert('✅ Estado actualizado correctamente')
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Error cambiando estado')
    }
  }

  const handleInputChange = (e) => {
    setNuevoProd({ ...nuevoProd, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNuevoProd({ ...nuevoProd, imagen: e.target.files[0] })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!nuevoProd.categoria) {
      alert('Seleccioná una categoría')
      return
    }

    const formData = new FormData()
    formData.append('nombre', nuevoProd.nombre)
    formData.append('categoria', nuevoProd.categoria)
    formData.append('precio', nuevoProd.precio)
    formData.append('stock', nuevoProd.stock)
    formData.append('stockMinimo', nuevoProd.stockMinimo)
    formData.append('descripcion', nuevoProd.descripcion)

    if (nuevoProd.imagen) formData.append('imagen', nuevoProd.imagen)

    crearProducto(formData)
    setMostrarModal(false)
    setNuevoProd({
      nombre: '',
      categoria: '',
      precio: '',
      stock: '',
      stockMinimo: 5,
      descripcion: '',
      imagen: null
    })
  }

 const abrirEditar = (prod) => {
  setProdEditar({
    id: prod.id,
    nombre: prod.nombre,
    categoria: prod.categoria,
    precio: prod.precio,
    stock: prod.stock,
    stockMinimo: prod.stockMinimo || 5,
    descripcion: prod.descripcion || '',
    imagen: null
  })

  setImagenesSecundarias([])
  cargarImagenesProducto(prod.id)
  setMostrarModalEditar(true)
}

  const handleEditChange = (e) => setProdEditar({ ...prodEditar, [e.target.name]: e.target.value })

  const handleEditFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProdEditar({ ...prodEditar, imagen: e.target.files[0] })
    }
  }
  const handleImagenesSecundariasChange = (e) => {
    if (e.target.files) {
      setImagenesSecundarias(Array.from(e.target.files))
    }
  }

  const cargarImagenesProducto = async (productoId) => {
    try {
      const res = await fetch(`${API_URL}/api/productos/${productoId}/imagenes`)
      const data = await res.json()
      setImagenesProductoActual(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error cargando imágenes secundarias:', err)
      setImagenesProductoActual([])
    }
  }

  const subirImagenesSecundarias = async (productoId) => {
    if (!imagenesSecundarias.length) {
      alert('Seleccioná al menos una imagen secundaria')
      return
    }

    try {
      const formData = new FormData()

      imagenesSecundarias.forEach((img) => {
        formData.append('imagenes', img)
      })

      const res = await fetch(`${API_URL}/api/productos/${productoId}/imagenes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudieron subir las imágenes secundarias')
      }

      setImagenesSecundarias([])
      await cargarImagenesProducto(productoId)
      alert('✅ Imágenes secundarias agregadas')
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Error subiendo imágenes secundarias')
    }
  }

  const eliminarImagenSecundaria = async (imagenId, productoId) => {
    const ok = window.confirm('¿Eliminar esta imagen secundaria?')
    if (!ok) return

    try {
      const res = await fetch(`${API_URL}/api/productos/imagenes/${imagenId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo eliminar la imagen')
      }

      await cargarImagenesProducto(productoId)
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Error eliminando imagen')
    }
  }

   const handleEditSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('nombre', prodEditar.nombre)
    formData.append('categoria', prodEditar.categoria)
    formData.append('precio', prodEditar.precio)
    formData.append('stock', prodEditar.stock)
    formData.append('stockMinimo', prodEditar.stockMinimo)
    formData.append('descripcion', prodEditar.descripcion)

    if (prodEditar.imagen) {
      formData.append('imagen', prodEditar.imagen)
    }

    const exito = await editarProductoAdmin(prodEditar.id, formData)

    if (exito) {
      setMostrarModalEditar(false)
      setProdEditar(null)
      setImagenesSecundarias([])
      setImagenesProductoActual([])
    }
  }

  const abrirReponer = (prod) => {
    setProductoAReponer(prod)
    setCantidadReponer(1)
    setMostrarModalReponer(true)
  }

  const confirmarReponer = async () => {
    if (!productoAReponer) return

    const cant = Number(cantidadReponer)
    if (!Number.isFinite(cant) || cant <= 0) {
      alert('Ingresá una cantidad válida (> 0)')
      return
    }

    try {
      if (typeof reponerProductoAdmin === 'function') {
        const actualizado = await reponerProductoAdmin(productoAReponer.id, cant)
        if (actualizado?.id) {
          setProductos(prev => prev.map(p => (
            p.id === actualizado.id ? { ...p, stock: actualizado.stock } : p
          )))
        } else {
          await cargarProductos()
        }
      } else {
        const res = await fetch(`${API_URL}/api/productos/${productoAReponer.id}/reponer`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ cantidad: cant })
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.success) throw new Error(data?.message || 'No se pudo reponer')

        setProductos(prev => prev.map(p => (
          p.id === data.producto.id ? { ...p, stock: data.producto.stock } : p
        )))
      }

      setMostrarModalReponer(false)
      setProductoAReponer(null)
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Error reponiendo stock')
    }
  }

  const eliminarProductoAdmin = async (id) => {
    const ok = window.confirm('¿Eliminar este producto del catálogo?')
    if (!ok) return

    try {
      const res = await fetch(`${API_URL}/api/productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo eliminar')
      }

      setProductos(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Error eliminando producto')
    }
  }

  const crearCategoria = async () => {
    const nombre = nuevaCategoria.trim()
    if (!nombre) return alert('Escribí un nombre de categoría')

    try {
      const res = await fetch(`${API_URL}/api/categorias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nombre })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        alert(data?.message || 'Error creando categoría')
        return
      }

      setNuevaCategoria('')
      await cargarCategorias()
      alert('✅ Categoría creada')
    } catch (e) {
      console.error(e)
      alert('Error de conexión creando categoría')
    }
  }

  const eliminarCategoria = async (id, nombreCategoria) => {
    const ok = window.confirm(`¿Seguro que quieres eliminar la categoría "${nombreCategoria}"? ¡Se borrarán TODOS los productos que le pertenezcan!`)
    if (!ok) return

    try {
      const res = await fetch(`${API_URL}/api/categorias/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo eliminar la categoría')
      }

      setCategorias(prev => prev.filter(c => c.id !== id))
      await cargarProductos()

      alert('✅ Categoría y productos asociados eliminados')
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Error eliminando la categoría')
    }
  }

  const dataCategoriasGraf = productos.reduce((acc, curr) => {
    const cat = acc.find(item => item.name === curr.categoria)
    if (cat) cat.value += curr.stock
    else acc.push({ name: curr.categoria, value: curr.stock })
    return acc
  }, [])

  const COLORES_TORTA = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const resumenUltimos6Meses = useMemo(() => {
    const hoy = new Date()
    const meses = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const nombreMes = d.toLocaleString('es-ES', { month: 'short' })
      const anioCorto = String(d.getFullYear()).slice(-2)

      meses.push({
        key,
        anio: d.getFullYear(),
        mesNumero: d.getMonth() + 1,
        name: `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} '${anioCorto}`,
        ventas: 0,
        pedidos: 0,
        ticketPromedio: 0
      })
    }

    pedidos.forEach((p) => {
      if (p.estado !== 'PAGADO' || !p.creado_en) return

      const fecha = new Date(p.creado_en)
      if (Number.isNaN(fecha.getTime())) return

      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      const mes = meses.find((m) => m.key === key)

      if (mes) {
        mes.ventas += Number(p.total || 0)
        mes.pedidos += 1
      }
    })

    meses.forEach((m) => {
      m.ticketPromedio = m.pedidos > 0 ? m.ventas / m.pedidos : 0
    })

    return meses
  }, [pedidos])

  const dataVentas = resumenUltimos6Meses.map((m) => ({
    name: m.name,
    ventas: m.ventas
  }))

  const mesActual = resumenUltimos6Meses[resumenUltimos6Meses.length - 1] || {
    ventas: 0,
    pedidos: 0,
    ticketPromedio: 0
  }

  const aniosDisponibles = useMemo(() => {
    const anios = new Set()

    pedidos.forEach((p) => {
      if (!p.creado_en) return
      const fecha = new Date(p.creado_en)
      if (!Number.isNaN(fecha.getTime())) {
        anios.add(fecha.getFullYear())
      }
    })

    anios.add(new Date().getFullYear())

    return Array.from(anios).sort((a, b) => b - a)
  }, [pedidos])

  const resumenAnual = useMemo(() => {
    const meses = nombresMeses.map((nombre, index) => ({
      key: `${anioSeleccionado}-${String(index + 1).padStart(2, '0')}`,
      mesNumero: index + 1,
      name: nombre,
      ventas: 0,
      pedidos: 0,
      ticketPromedio: 0
    }))

    pedidos.forEach((p) => {
      if (p.estado !== 'PAGADO' || !p.creado_en) return

      const fecha = new Date(p.creado_en)
      if (Number.isNaN(fecha.getTime())) return

      const anio = fecha.getFullYear()
      const mes = fecha.getMonth() + 1

      if (anio === anioSeleccionado) {
        const itemMes = meses.find((m) => m.mesNumero === mes)
        if (itemMes) {
          itemMes.ventas += Number(p.total || 0)
          itemMes.pedidos += 1
        }
      }
    })

    meses.forEach((m) => {
      m.ticketPromedio = m.pedidos > 0 ? m.ventas / m.pedidos : 0
    })

    return meses
  }, [pedidos, anioSeleccionado])

  const mesSeleccionadoData =
    resumenAnual.find((m) => m.mesNumero === Number(mesSeleccionado)) || {
      ventas: 0,
      pedidos: 0,
      ticketPromedio: 0,
      name: ''
    }

  const totalProductos = productos.length
  const sinStock = productos.filter(p => p.stock === 0).length
  const valorInventario = productos.reduce((acc, p) => acc + (Number(p.precio || 0) * Number(p.stock || 0)), 0)

  const totalVendidoHistorico = pedidos
    .filter(p => p.estado === 'PAGADO')
    .reduce((acc, p) => acc + Number(p.total || 0), 0)

  const productosFiltrados = productos.filter(prod =>
    prod.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const pedidosPendientes = pedidos.filter(p => p.estado === 'PENDIENTE')

  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = busqueda.toLowerCase()
    return (
      (u.username || '').toLowerCase().includes(texto) ||
      (u.nombre || '').toLowerCase().includes(texto) ||
      (u.email || '').toLowerCase().includes(texto)
    )
  })

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>APOLO<span>MATE</span></h2>
          <p>Admin Panel</p>
        </div>

        <nav className="sidebar-menu">
          <button className={`menu-item ${vistaActiva === 'dashboard' ? 'active' : ''}`} onClick={() => setVistaActiva('dashboard')}>
            📊 Dashboard
          </button>

          <button className={`menu-item ${vistaActiva === 'inventario' ? 'active' : ''}`} onClick={() => setVistaActiva('inventario')}>
            📦 Inventario
          </button>

          <button className={`menu-item ${vistaActiva === 'categorias' ? 'active' : ''}`} onClick={() => setVistaActiva('categorias')}>
            📁 Categorías
          </button>

          <button className={`menu-item ${vistaActiva === 'pedidos' ? 'active' : ''}`} onClick={() => setVistaActiva('pedidos')}>
            🛒 Pedidos {pedidosPendientes.length > 0 && <span className="badge-alert">{pedidosPendientes.length}</span>}
          </button>

          <button
            className={`menu-item ${vistaActiva === 'usuarios' ? 'active' : ''}`}
            onClick={() => {
              setVistaActiva('usuarios')
              cargarUsuarios()
            }}
          >
            👥 Usuarios
          </button>

          <button className={`menu-item ${vistaActiva === 'logs' ? 'active' : ''}`} onClick={() => { setVistaActiva('logs'); cargarLogs(); }}>
            📜 Historial
          </button>

          <button className={`menu-item ${vistaActiva === 'ajustes' ? 'active' : ''}`} onClick={() => setVistaActiva('ajustes')}>
            ⚙️ Ajustes
          </button>

          <div className="separator"></div>
          <Link to="/" className="menu-item logout">← Volver a Tienda</Link>
        </nav>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <h2 className="welcome-text">Hola, {adminNombre} 👋</h2>
          <div className="topbar-actions">
            <input
              type="text"
              placeholder="🔍 Buscar..."
              className="topbar-search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <div className="admin-profile">{adminIniciales}</div>
          </div>
        </header>

       {vistaActiva === 'dashboard' && (
  <>
    <section className="overview-cards">
      <div className="stat-card">
        <div className="stat-icon money">💰</div>
        <div className="stat-info">
          <h3>${Number(mesActual.ventas || 0).toLocaleString('es-AR')}</h3>
          <p>Facturación del Mes</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon chart">🧾</div>
        <div className="stat-info">
          <h3>{mesActual.pedidos || 0}</h3>
          <p>Pedidos del Mes</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon box">📊</div>
        <div className="stat-info">
          <h3>${Number(mesActual.ticketPromedio || 0).toLocaleString('es-AR')}</h3>
          <p>Ticket Promedio</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon warning">🏦</div>
        <div className="stat-info">
          <h3>${Number(totalVendidoHistorico || 0).toLocaleString('es-AR')}</h3>
          <p>Facturación Histórica</p>
        </div>
      </div>
    </section>

    <section className="overview-cards" style={{ marginTop: '20px' }}>
      <div className="stat-card">
        <div className="stat-icon box">📦</div>
        <div className="stat-info">
          <h3>{totalProductos}</h3>
          <p>Productos</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon chart">🏷️</div>
        <div className="stat-info">
          <h3>${Number(valorInventario || 0).toLocaleString('es-AR')}</h3>
          <p>Valor Stock</p>
        </div>
      </div>

      <div className="stat-card alert">
        <div className="stat-icon warning">⚠️</div>
        <div className="stat-info">
          <h3>{sinStock}</h3>
          <p>Sin Stock</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon money">📈</div>
        <div className="stat-info">
          <h3>${Number(mesActual.ventas || 0).toLocaleString('es-AR')}</h3>
          <p>Ganancia Estimada*</p>
        </div>
      </div>
    </section>

    <section className="charts-grid">
      <div className="chart-container" style={{ minWidth: 0 }}>
        <h3>📈 Facturación - Últimos 6 meses</h3>
        <div style={{ width: '100%', height: 250, minWidth: 0 }}>
          <ResponsiveContainer>
            <AreaChart data={dataVentas}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => `$${Number(value || 0).toLocaleString('es-AR')}`} />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorVentas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-container" style={{ minWidth: 0 }}>
        <h3>🍰 Distribución por Categoría</h3>
        <div style={{ width: '100%', height: 250, minWidth: 0 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={dataCategoriasGraf}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {dataCategoriasGraf.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>

    <section className="recent-orders" style={{ marginTop: '25px' }}>
      <div className="section-header">
        <h3>📅 Resumen de los últimos 6 meses</h3>
      </div>

      <div className="table-responsive">
        <table className="clean-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Pedidos Pagados</th>
              <th>Facturación</th>
              <th>Ticket Promedio</th>
              <th>Ganancia Estimada*</th>
            </tr>
          </thead>
          <tbody>
            {resumenUltimos6Meses.map((mes) => (
              <tr key={mes.key}>
                <td style={{ fontWeight: 'bold' }}>{mes.name}</td>
                <td>{mes.pedidos}</td>
                <td>${Number(mes.ventas || 0).toLocaleString('es-AR')}</td>
                <td>${Number(mes.ticketPromedio || 0).toLocaleString('es-AR')}</td>
                <td>${Number(mes.ventas || 0).toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '12px' }}>
        *Ganancia estimada = facturación. Para ganancia real habría que cargar también el costo de cada producto.
      </p>
    </section>

    <section className="recent-orders" style={{ marginTop: '25px' }}>
      <div className="section-header">
        <h3>🗂️ Historial por año y mes</h3>
      </div>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ minWidth: '220px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Año</label>
          <select
            className="form-input"
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
          >
            {aniosDisponibles.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '220px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Mes</label>
          <select
            className="form-input"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(Number(e.target.value))}
          >
            {nombresMeses.map((mes, index) => (
              <option key={mes} value={index + 1}>
                {mes}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="overview-cards" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon money">💰</div>
          <div className="stat-info">
            <h3>${Number(mesSeleccionadoData.ventas || 0).toLocaleString('es-AR')}</h3>
            <p>Facturación de {mesSeleccionadoData.name || 'Mes'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon chart">🧾</div>
          <div className="stat-info">
            <h3>{mesSeleccionadoData.pedidos || 0}</h3>
            <p>Pedidos de {mesSeleccionadoData.name || 'Mes'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon box">📊</div>
          <div className="stat-info">
            <h3>${Number(mesSeleccionadoData.ticketPromedio || 0).toLocaleString('es-AR')}</h3>
            <p>Ticket Promedio</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon money">📈</div>
          <div className="stat-info">
            <h3>${Number(mesSeleccionadoData.ventas || 0).toLocaleString('es-AR')}</h3>
            <p>Ganancia Estimada*</p>
          </div>
        </div>
      </section>

      <div className="table-responsive">
        <table className="clean-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Pedidos Pagados</th>
              <th>Facturación</th>
              <th>Ticket Promedio</th>
              <th>Ganancia Estimada*</th>
            </tr>
          </thead>
          <tbody>
            {resumenAnual.map((mes) => (
              <tr key={mes.key}>
                <td style={{ fontWeight: 'bold' }}>{mes.name}</td>
                <td>{mes.pedidos}</td>
                <td>${Number(mes.ventas || 0).toLocaleString('es-AR')}</td>
                <td>${Number(mes.ticketPromedio || 0).toLocaleString('es-AR')}</td>
                <td>${Number(mes.ventas || 0).toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '12px' }}>
        *Ganancia estimada = facturación. Para ganancia real habría que cargar también el costo de cada producto.
      </p>
    </section>
  </>
)}

        {vistaActiva === 'inventario' && (
          <section className="recent-orders">
            <div className="section-header">
              <h3>Inventario Detallado</h3>
              <button className="btn-add" onClick={() => setMostrarModal(true)}>+ Nuevo Producto</button>
            </div>

            <div className="table-responsive">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Img</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map(prod => (
                    <tr key={prod.id}>
                      <td>
                        {prod.imagen ? (
                          <img
                            src={`${API_URL}${prod.imagen}`}
                            alt="mini"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : (
                          <span>📷</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{prod.nombre}</td>
                      <td>{prod.categoria}</td>
                      <td>${Number(prod.precio || 0).toLocaleString()}</td>
                      <td>{prod.stock}</td>
                      <td>
                        <span className={`status-badge ${prod.stock === 0 ? 'out' : prod.stock <= prod.stockMinimo ? 'low' : 'ok'}`}>
                          {prod.stock === 0 ? 'Agotado' : prod.stock <= prod.stockMinimo ? 'Bajo' : 'En Stock'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-add" style={{ background: '#f59e0b' }} onClick={() => abrirEditar(prod)}>
                          ✏️ Editar
                        </button>

                        <button className="btn-add" style={{ background: '#3b82f6' }} onClick={() => abrirReponer(prod)}>
                          ➕ Reponer
                        </button>

                        <button className="btn-add" style={{ background: '#ef4444' }} onClick={() => eliminarProductoAdmin(prod.id)}>
                          🗑 Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {vistaActiva === 'categorias' && (
          <section className="recent-orders">
            <div className="section-header">
              <h3>Categorías</h3>
            </div>

            <div className="table-responsive">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.length === 0 ? (
                    <tr><td colSpan="2" style={{ padding: 20, textAlign: 'center' }}>No hay categorías todavía</td></tr>
                  ) : (
                    categorias.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 'bold' }}>{c.nombre}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-add"
                            style={{ background: '#ef4444', padding: '5px 10px', fontSize: '0.8rem' }}
                            onClick={() => eliminarCategoria(c.id, c.nombre)}
                          >
                            🗑 Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 15, marginTop: 20 }}>
              <input
                type="text"
                placeholder="Nueva categoría..."
                className="topbar-search"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
              />
              <button className="btn-add" onClick={crearCategoria}>+ Agregar</button>
            </div>
          </section>
        )}

        {vistaActiva === 'pedidos' && (
          <section className="recent-orders">
            <h3>Lista de Pedidos</h3>
            <div className="table-responsive">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No hay pedidos</td></tr>
                  ) : (
                    pedidos.map(p => (
                      <tr key={p.id}>
                        <td>{p.cliente}</td>
                        <td>${Number(p.total || 0).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${p.estado === 'PENDIENTE' ? 'low' : 'ok'}`}>
                            {p.estado}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <button
                            className="btn-add"
                            style={{ background: '#3b82f6' }}
                            onClick={() => verDetallePedidoAdmin(p.id)}
                            disabled={cargandoDetalle}
                          >
                            👁️ Detalles
                          </button>

                          {p.estado === 'PENDIENTE' && (
                            <button className="btn-add" style={{ background: '#10b981' }} onClick={() => confirmarPedidoAdmin(p.id)}>
                              ✅ Confirmar
                            </button>
                          )}

                          <button className="btn-add" style={{ background: '#ef4444' }} onClick={() => eliminarPedidoAdmin(p.id)}>
                            🗑 Eliminar
                          </button>

                          {p.estado === 'PAGADO' && <span>✅</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {vistaActiva === 'usuarios' && (
          <section className="recent-orders">
            <div className="section-header">
              <h3>👥 Gestión de Usuarios</h3>
              <button className="btn-add" onClick={cargarUsuarios}>🔄 Actualizar</button>
            </div>

            <div className="table-responsive">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td style={{ fontWeight: 'bold' }}>{u.username}</td>
                        <td>{u.nombre || '-'}</td>
                        <td>{u.email || '-'}</td>
                        <td>{u.telefono || '-'}</td>
                        <td>
                          <span className={`status-badge ${u.role === 'admin' ? 'ok' : 'low'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${u.activo ? 'ok' : 'out'}`}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            className="btn-add"
                            style={{ background: u.role === 'admin' ? '#f59e0b' : '#10b981' }}
                            onClick={() => cambiarRolUsuarioAdmin(u.id, u.role)}
                          >
                            {u.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                          </button>

                          <button
                            className="btn-add"
                            style={{ background: u.activo ? '#ef4444' : '#3b82f6' }}
                            onClick={() => cambiarEstadoUsuarioAdmin(u.id, u.activo)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {vistaActiva === 'logs' && (
          <section className="recent-orders">
            <div className="section-header">
              <h3>📜 Historial de Actividad</h3>
              <button className="btn-add" style={{ background: '#444' }} onClick={cargarLogs}>🔄 Actualizar</button>
            </div>

            <div className="table-responsive">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Usuario / Actor</th>
                    <th>Acción</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>No hay actividad registrada aún.</td></tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ color: '#aaa', fontSize: '0.9rem' }}>{new Date(log.creado_en).toLocaleString('es-AR')}</td>
                        <td style={{ fontWeight: 'bold', color: '#fff' }}>{log.usuario}</td>
                        <td>
                          <span style={{ background: '#222', color: '#c5a059', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #444' }}>
                            {log.accion}
                          </span>
                        </td>
                        <td style={{ color: '#ccc', fontSize: '0.9rem' }}>{log.detalle}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

                    {vistaActiva === 'ajustes' && (
          <section className="recent-orders">
            <div className="section-header">
              <h3>⚙️ Configuración General de la Tienda</h3>
            </div>

            <div
              className="checkout-card"
              style={{ maxWidth: '400px', margin: '20px 0', border: '1px solid #333' }}
            >
              <div className="form-group">
                <label className="form-label" style={{ color: '#009ee3', fontWeight: 'bold' }}>
                  Recargo por Tarjeta / Mercado Pago (%)
                </label>
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>
                  Este porcentaje se sumará al subtotal de la compra cuando el cliente elija Mercado Pago.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={recargoMP}
                    onChange={(e) => setRecargoMP(e.target.value)}
                    min="0"
                    style={{ flex: 1, fontSize: '1.2rem', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '1.2rem', color: '#fff' }}>%</span>
                </div>
              </div>

              <button
                className="btn-whatsapp"
                style={{ background: '#3b82f6', marginTop: '10px' }}
                onClick={guardarConfiguracion}
              >
                Guardar Configuración 💾
              </button>
            </div>

            <div
              className="checkout-card"
              style={{ marginTop: '25px', border: '1px solid #333' }}
            >
              <h3 style={{ marginBottom: '20px', color: '#c5a059' }}>🖼️ Gestión del Carrusel</h3>

              <form onSubmit={crearBanner}>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Imagen del banner</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={handleBannerFileChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Título (opcional)</label>
                  <input
                    type="text"
                    name="titulo"
                    className="form-input"
                    value={nuevoBanner.titulo}
                    onChange={handleBannerInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subtítulo (opcional)</label>
                  <input
                    type="text"
                    name="subtitulo"
                    className="form-input"
                    value={nuevoBanner.subtitulo}
                    onChange={handleBannerInputChange}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Orden</label>
                    <input
                      type="number"
                      name="orden"
                      className="form-input"
                      value={nuevoBanner.orden}
                      onChange={handleBannerInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Activo</label>
                    <select
                      name="activo"
                      className="form-input"
                      value={nuevoBanner.activo}
                      onChange={handleBannerInputChange}
                    >
                      <option value={1}>Sí</option>
                      <option value={0}>No</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-whatsapp" style={{ marginTop: '10px' }}>
                  + Agregar Banner
                </button>
              </form>

              <div style={{ marginTop: '30px' }}>
                <h4 style={{ color: '#fff', marginBottom: '15px' }}>Banners cargados</h4>

                {banners.length === 0 ? (
                  <p style={{ color: '#aaa' }}>No hay banners cargados todavía.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {banners.map((banner) => (
                      <div
                        key={banner.id}
                        style={{
                          border: '1px solid #333',
                          borderRadius: '12px',
                          padding: '15px',
                          background: '#111'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}
                        >
                          <img
                            src={`${API_URL}${banner.imagen}`}
                            alt={banner.titulo || 'Banner'}
                            style={{
                              width: '180px',
                              height: '90px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              border: '1px solid #333'
                            }}
                          />

                          <div style={{ flex: 1, minWidth: '220px' }}>
                            <p style={{ margin: '0 0 8px 0', color: '#fff', fontWeight: 'bold' }}>
                              {banner.titulo || 'Sin título'}
                            </p>
                            <p style={{ margin: '0 0 10px 0', color: '#aaa' }}>
                              {banner.subtitulo || 'Sin subtítulo'}
                            </p>
                            <p style={{ margin: 0, color: banner.activo ? '#10b981' : '#ef4444' }}>
                              {banner.activo ? 'Activo' : 'Inactivo'}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                              type="number"
                              defaultValue={banner.orden}
                              onBlur={(e) => cambiarOrdenBanner(banner, e.target.value)}
                              className="form-input"
                              style={{ width: '90px' }}
                            />

                            <button
                              type="button"
                              className="btn-add"
                              style={{ background: banner.activo ? '#f59e0b' : '#10b981' }}
                              onClick={() => cambiarEstadoBanner(banner)}
                            >
                              {banner.activo ? 'Desactivar' : 'Activar'}
                            </button>

                            <button
                              type="button"
                              className="btn-add"
                              style={{ background: '#ef4444' }}
                              onClick={() => eliminarBanner(banner.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {modalDetalleAbierto && (
        <div
          className="checkout-overlay"
          onClick={() => setModalDetalleAbierto(false)}
        >
          <div
            className="checkout-card"
            style={{ maxWidth: '700px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <h2 className="checkout-title" style={{ margin: 0 }}>
                Detalle del Pedido #{pedidoDetalle?.id}
              </h2>

              <button
                type="button"
                className="btn-cancel"
                onClick={() => setModalDetalleAbierto(false)}
              >
                Cerrar
              </button>
            </div>

                       {!pedidoDetalle ? (
              <p style={{ color: '#aaa' }}>Cargando detalle...</p>
            ) : (
              <>
                <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                  <p>
                    <strong>Cliente:</strong>{' '}
                    {pedidoDetalle.clienteNombre ||
                      pedidoDetalle.cliente ||
                      pedidoDetalle.cliente_nombre ||
                      '-'}
                  </p>

                  <p>
                    <strong>Total:</strong> $
                    {Number(pedidoDetalle.total || 0).toLocaleString('es-AR')}
                  </p>

                  <p>
                    <strong>Estado:</strong> {pedidoDetalle.estado || '-'}
                  </p>

                  <p>
                    <strong>Método de pago:</strong>{' '}
                    {pedidoDetalle.metodoPago ||
                      pedidoDetalle.metodo_pago ||
                      pedidoDetalle.formaPago ||
                      pedidoDetalle.forma_pago ||
                      pedidoDetalle.pago ||
                      pedidoDetalle.metodo ||
                      'No disponible'}
                  </p>

                  <p>
                    <strong>Tipo de entrega:</strong>{' '}
                    {pedidoDetalle.tipoEntrega ||
                      pedidoDetalle.tipo_entrega ||
                      pedidoDetalle.entrega ||
                      pedidoDetalle.tipo_envio ||
                      pedidoDetalle.envio ||
                      (pedidoDetalle.clienteDireccion?.toLowerCase().includes('retiro')
                        ? 'Retiro'
                        : 'Envío') ||
                      '-'}
                  </p>

                  <p>
                    <strong>Dirección:</strong>{' '}
                    {pedidoDetalle.clienteDireccion ||
                      pedidoDetalle.direccion ||
                      pedidoDetalle.domicilio ||
                      pedidoDetalle.direccion_envio ||
                      pedidoDetalle.envio_direccion ||
                      pedidoDetalle.direccionEntrega ||
                      pedidoDetalle.direccion_entrega ||
                      '-'}
                  </p>

                  <p>
                    <strong>Fecha:</strong>{' '}
                    {pedidoDetalle.creado_en
                      ? new Date(pedidoDetalle.creado_en).toLocaleString('es-AR')
                      : '-'}
                  </p>
                </div>

                <h3 style={{ color: '#c5a059', marginBottom: '12px' }}>Productos</h3>

                {Array.isArray(pedidoDetalle.items) && pedidoDetalle.items.length > 0 ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {pedidoDetalle.items.map((item, index) => (
                      <div
                        key={item.id || index}
                        style={{
                          background: '#181818',
                          border: '1px solid #2a2a2a',
                          borderRadius: '12px',
                          padding: '12px 14px'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>
                          {item.nombre}
                        </div>

                        <div style={{ color: '#aaa', marginTop: '4px' }}>
                          Cantidad: {item.cantidad} | Precio: $
                          {Number(item.precio || 0).toLocaleString('es-AR')}
                        </div>

                        <div style={{ color: '#10b981', marginTop: '4px', fontWeight: 'bold' }}>
                          Subtotal: $
                          {Number((item.precio || 0) * (item.cantidad || 0)).toLocaleString('es-AR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#aaa' }}>Este pedido no tiene items cargados.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="checkout-overlay">
          <div className="checkout-card" style={{ maxWidth: '500px' }}>
            <h2 className="checkout-title">Nuevo Producto</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  className="form-input"
                  onChange={handleInputChange}
                  value={nuevoProd.nombre}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  name="descripcion"
                  className="form-input"
                  onChange={handleInputChange}
                  value={nuevoProd.descripcion}
                  rows="4"
                  placeholder="Escribí una descripción del producto..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  name="categoria"
                  className="form-input"
                  onChange={handleInputChange}
                  value={nuevoProd.categoria}
                  required
                >
                  <option value="" disabled>Seleccionar categoría...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Precio ($)</label>
                  <input
                    type="number"
                    name="precio"
                    required
                    className="form-input"
                    onChange={handleInputChange}
                    value={nuevoProd.precio}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Inicial</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    className="form-input"
                    onChange={handleInputChange}
                    value={nuevoProd.stock}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Stock mínimo</label>
                <input
                  type="number"
                  name="stockMinimo"
                  className="form-input"
                  onChange={handleInputChange}
                  value={nuevoProd.stockMinimo}
                />
              </div>

              <div className="form-group" style={{ border: '1px dashed #444', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                <label className="form-label">📸 Imagen del Producto</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={handleFileChange}
                />
              </div>

              <button type="submit" className="btn-whatsapp">
                Guardar Producto 💾
              </button>

              <button
                type="button"
                className="btn-cancel"
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {mostrarModalEditar && prodEditar && (
        <div className="checkout-overlay">
          <div className="checkout-card" style={{ maxWidth: '500px' }}>
            <h2 className="checkout-title" style={{ color: '#f59e0b' }}>Editar Producto</h2>
            <form onSubmit={handleEditSubmit}>
              <div
                className="form-group"
                style={{
                  border: '1px dashed #f59e0b',
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}
              >
                <label className="form-label">📸 Cambiar Imagen (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={handleEditFileChange}
                />
              </div>

              <div
                className="form-group"
                style={{
                  border: '1px dashed #3b82f6',
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}
              >
                <label className="form-label">🖼️ Imágenes secundarias</label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-input"
                  onChange={handleImagenesSecundariasChange}
                />

                {imagenesSecundarias.length > 0 && (
                  <div style={{ marginTop: '10px', color: '#aaa', fontSize: '0.9rem' }}>
                    {imagenesSecundarias.length} imagen(es) seleccionada(s)
                  </div>
                )}

                <button
                  type="button"
                  className="btn-add"
                  style={{ background: '#3b82f6', marginTop: '10px' }}
                  onClick={() => subirImagenesSecundarias(prodEditar.id)}
                >
                  Subir imágenes secundarias
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Galería actual</label>

                {imagenesProductoActual.length === 0 ? (
                  <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                    Este producto no tiene imágenes secundarias todavía.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {imagenesProductoActual.map((img) => (
                      <div
                        key={img.id}
                        style={{
                          position: 'relative',
                          width: '90px',
                          height: '90px'
                        }}
                      >
                        <img
                          src={`${API_URL}${img.imagen}`}
                          alt="secundaria"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #333'
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => eliminarImagenSecundaria(img.id, prodEditar.id)}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  className="form-input"
                  onChange={handleEditChange}
                  value={prodEditar.nombre}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  name="descripcion"
                  className="form-input"
                  onChange={handleEditChange}
                  value={prodEditar.descripcion}
                  rows="4"
                  placeholder="Escribí una descripción del producto..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  name="categoria"
                  className="form-input"
                  onChange={handleEditChange}
                  value={prodEditar.categoria}
                  required
                >
                  <option value="" disabled>Seleccionar categoría...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Precio ($)</label>
                  <input
                    type="number"
                    name="precio"
                    required
                    className="form-input"
                    onChange={handleEditChange}
                    value={prodEditar.precio}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Real</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    className="form-input"
                    onChange={handleEditChange}
                    value={prodEditar.stock}
                  />
                </div>
              </div>

              <button type="submit" className="btn-whatsapp" style={{ background: '#f59e0b' }}>
                Guardar Cambios 💾
              </button>

              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setMostrarModalEditar(false)
                  setProdEditar(null)
                  setImagenesSecundarias([])
                  setImagenesProductoActual([])
                }}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}