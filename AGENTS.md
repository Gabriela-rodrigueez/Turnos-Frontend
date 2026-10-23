# 🤖 Directrices para Agentes de IA - Frontend (Turnos-Frontend)

Este archivo define los estándares obligatorios de diseño UX/UI, consistencia visual, arquitectura y buenas prácticas de desarrollo frontend para cualquier agente de IA que trabaje en este repositorio.

---

## 🎭 1. Rol del Agente
Todo agente de IA que opere en este repositorio debe asumir el rol de **Especialista Senior en Diseño UX/UI, Accesibilidad Web y Arquitectura Frontend Angular**. 
Su misión fundamental es garantizar que todas las vistas pertenezcan de manera evidente a un **único sistema integrado, moderno, predecible y estéticamente refinado**, eliminando cualquier disparidad visual o funcional entre pantallas.

---

## 🌐 2. Idioma e Interacción
- **Español Obligatorio**: Toda la comunicación, explicaciones, comentarios de código, nombres de commits y textos de interfaz de usuario deben realizarse estrictamente en español.

---

## 📐 3. Estandarización de Layout y Contenedores

### 3.1 Arquitectura de Layout Unificado: Sidenav Lateral y Contenedor Principal
Para garantizar una experiencia predecible, moderna y sin fricciones, **todas las vistas de la aplicación con sesión/portal comparten la misma estructura de layout**:
- **Estructura Base Global**:
  ```html
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans flex antialiased">
    <!-- Sidenav Lateral Izquierdo Fijo (w-64) -->
    <app-sidebar></app-sidebar>

    <!-- Contenedor Derecho (Header de contexto + Contenido Dinámico) -->
    <div class="flex-1 lg:ml-64 flex flex-col min-w-0 min-h-screen">
      <!-- Header Superior Delgado de Estado (h-16) -->
      <header class="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        ...
      </header>

      <!-- Contenedor Principal de la Vista (max-w-6xl estandarizado) -->
      <main class="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <router-outlet></router-outlet>
      </main>
    </div>
  </div>
  ```
- **Grillas de Tarjetas de Contenido**:
  ```html
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  ```

---

## 🎨 4. Sistema de Diseño y Tokens Visuales

### 4.1 Paleta de Colores Institucional
- **Azul Primario Oficial (SaludMza)**: `#004a8a`
  - Hover: `#00386b`
  - Active: `#002d57`
  - Fondos suaves: `bg-[#004a8a]/10` o `bg-blue-50`
  - Anillos de foco: `focus:ring-2 focus:ring-[#004a8a]`
- **Superficies y Fondos**:
  - Fondo global: `bg-slate-50`
  - Tarjetas y componentes: `bg-white`
  - Fondos deshabilitados o secundarios: `bg-slate-100`
- **Bordes y Divisores**:
  - Estándar: `border-slate-200`
  - Divisores suaves: `border-slate-100`
- **Tipografía y Jerarquía**:
  - Títulos principales (h1, h2): `font-bold text-slate-900 tracking-tight`
  - Subtítulos y descripciones: `text-sm text-slate-600`
  - Etiquetas y metadatos: `text-xs font-semibold text-slate-700` o `text-[11px] text-slate-500`

### 4.2 Semántica de Estados Clínicos y Operativos
Todas las vistas deben emplear la misma convención de colores para estados:
- **DISPONIBLE / LIBRE**: `bg-sky-50 text-sky-800 border-sky-200`
- **RESERVADO / CONFIRMADO**: `bg-amber-50 text-amber-800 border-amber-300`
- **ASISTIDO / COMPLETADO**: `bg-emerald-50 text-emerald-800 border-emerald-300`
- **CANCELADO / INACTIVO**: `bg-slate-100 text-slate-600 border-slate-300`
- **ALERTA DE ERROR / CONFLICTO**: `bg-rose-50 text-rose-700 border-rose-200`

---

## 🪟 5. Componentes Estandarizados

### 5.1 Barra de Navegación Lateral (Sidenav / Sidebar) y Header de Estado
- **Identidad Visual**: Cabecera del sidebar con marca oficial `SaludMza` (Gobierno de Mendoza - Salud), subtítulo y badge contextual.
- **Estructura Lógica Organizada por Rol (Information Architecture)**:
  - **Rol Paciente (`PACIENTE`)**:
    - Grupo *Atención Médica*: Solicitar Turno (`/buscar`), Mis Turnos (`/mis-turnos`).
    - Grupo *Mi Salud*: Historia Clínica (`/mi-historial`).
  - **Rol Administrativo (`ADMINISTRADOR`)**:
    - Grupo *Mesa de Entrada & Turnos*: Consultar Turnos (`/admin/panel-principal` / `/admin`), Solicitar Turno Presencial (`/admin/nueva-cita`), Gestionar Agenda Médica (`/agenda`).
    - Grupo *Catálogos Maestros*: Profesionales / Médicos (`/admin/profesionales`), Especialidades (`/admin/especialidades`), Obras Sociales (`/admin/obras-sociales`).
  - **Rol Médico (`MEDICO`)**:
    - Grupo *Mi Consultorio & Atención*: Gestionar Agenda Médica (`/agenda`), Consultar Historial Clínico (`/mi-historial`).
- **Estados Activos**: Enlaces con `routerLinkActive="!bg-[#004a8a] !text-white font-bold shadow-xs"`.
- **Ficha de Usuario Inferior**: Pie del sidebar con nombre completo del usuario, badge de rol en mayúsculas, avatar con iniciales y botón accesible para cerrar sesión.
- **Header Superior Delgado (Top Bar de Contexto)**: Muestra el selector de sede o área hospitalaria, reloj en tiempo real con formato argentino (`HH:mm hs`), campana de notificaciones y botón de menú tipo hamburguesa para dispositivos móviles/tablets.

### 5.2 Modales y Diálogos Flotantes
Todo modal debe cumplir obligatoriamente con el patrón institucional:
1. **Backdrop**:
   ```html
   <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
   ```
2. **Contenedor Modal**:
   ```html
   <div class="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-scaleUp">
   ```
3. **Cierre accesible triple**:
   - Botón de cierre visible "✕" en la cabecera.
   - Cierre al hacer clic en el backdrop fuera del modal.
   - Cierre al presionar la tecla `Escape` mediante `@HostListener('document:keydown.escape')`.

### 5.3 Estados Vacíos (Empty States)
Nunca mostrar un contenedor vacío sin feedback. Todo estado sin datos debe incluir:
- Icono temático destacado (`text-2xl` o `text-3xl`).
- Título claro en negrita (`text-lg font-bold text-slate-900`).
- Mensaje explicativo amigable (`text-sm text-slate-500`).
- Botón de llamada a la acción (CTA) sugerido para resolver la situación.

### 5.4 Formularios y Controles
- Controles de altura consistente (`h-10` o `h-11`), esquinas redondeadas (`rounded-lg`), bordes `border-slate-300`, y transición en foco (`focus:ring-2 focus:ring-[#004a8a] focus:outline-none`).
- Campos obligatorios siempre marcados visualmente con un asterisco rojo (`<span class="text-rose-500">*</span>`).

---

## ♿ 6. Accesibilidad (a11y) y Experiencia de Usuario (UX)
1. **Cero Fricción en Selección**: Si un usuario tiene una única especialidad o un único consultorio asignado, el sistema debe autoseleccionarlo y cargar los datos automáticamente.
2. **Textos Legibles y Contraste WCAG**: Evitar grises claros sobre fondos blancos. Siempre utilizar contraste suficiente para textos informativos (`text-slate-600` o superior).
3. **Manejo de Carga**: Toda operación asíncrona debe reflejarse con un indicador de carga claro (spinner y texto descriptivo).
4. **Formatos Regionales**: Mostrar fechas y horas en formato estándar argentino (`dd/MM/yyyy`, `HH:mm hs`, o `Día DD de Mes de AAAA`).

---

## 🧪 7. Verificación Obligatoria de Calidad
- **Pruebas Automatizadas**: Ninguna modificación de interfaz, componente o servicio se considerará finalizada sin ejecutar `npm test -- --watch=false` y verificar que el **100% de las pruebas pasen sin errores**.
- **Tipado Estricto**: No utilizar `any` arbitrarios ni suprimir validaciones de TypeScript (`@ts-ignore`). Respetar las interfaces de modelo definidas.

---

## 🧩 8. Reutilización Obligatoria de Componentes
- **Cero Código Duplicado**: Si un patrón de diseño, bloque estructural o elemento interactivo se encuentra presente en más de una vista (por ejemplo: encabezados de navegación, diálogos modales, alertas del sistema, tarjetas de turnos, selectores de catálogos, estados vacíos), **debe obligatoriamente extraerse y definirse como un componente standalone reutilizable** dentro de `src/app/components/shared/` o el módulo correspondiente, para ser importado donde se requiera.
- **Consistencia Modular**: La reutilización mediante componentes garantiza que cualquier ajuste de diseño, accesibilidad o accesos de roles se propague de manera inmediata y homogénea en todo el frontend.

---

## 🛑 9. Protocolo de Modificación de Estilos y Directrices

> [!WARNING]
> ### ⚠️ Aprobación Estricta del Usuario para Modificar Guidelines
> Si durante el desarrollo el usuario solicita explícitamente una modificación visual, estructural o funcional que contradiga, altere o extienda los estilos y patrones definidos en este `AGENTS.md` (por ejemplo: reemplazar la barra de navegación horizontal por una barra lateral en el header, cambiar el ancho estandarizado de pantalla, alterar la paleta de colores institucional o modificar el comportamiento de los modales), el agente de IA **debe cumplir obligatoriamente los siguientes pasos**:
> 
> 1. **Detenerse e Informar al Usuario**: Notificarle que la directriz actual de `AGENTS.md` define una regla distinta para ese componente o layout.
> 2. **Proponer la Actualización de `AGENTS.md`**: Sugerir la modificación formal de este documento para mantenerlo sincronizado y garantizar que futuros agentes sigan la nueva decisión de diseño.
> 3. **Evaluación de Impacto y Replicación en Código Previo**: Indicar e informar explícitamente al usuario qué vistas, componentes o archivos existentes se verán afectados por el cambio y deben ser modificados en cascada para preservar la homogeneidad de todo el frontend (por ejemplo: si se altera la paleta de colores, indicar qué vistas y componentes previos deben ajustarse para evitar inconsistencias visuales).
> 4. **Prohibición de Cambios Automáticos**: El agente **no debe modificar este archivo `AGENTS.md` ni aplicar cambios divergentes automáticamente sin la aprobación previa y explícita del usuario**.
