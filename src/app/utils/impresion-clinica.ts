import { HistoriaClinicaResponse } from '../services/historial-clinico';

export interface DatosPacienteImpresion {
  nombreCompleto: string;
  dni: string;
  obraSocial?: string;
  email?: string;
  telefono?: string;
}

/**
 * Genera un documento imprimible institucional con el expediente y evolución clínica del paciente.
 * Utiliza un iframe aislado para asegurar que la impresión sea limpia, legible y sin interferencias de layouts o modales.
 */
export function imprimirHistoriaClinicaDocumento(
  paciente: DatosPacienteImpresion,
  atenciones: HistoriaClinicaResponse[]
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const fechaEmision = new Date().toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const consultasHtml = atenciones && atenciones.length > 0
    ? atenciones.map((item, index) => {
        const fechaHora = item.fechaAtencion 
          ? new Date(item.fechaAtencion).toLocaleString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) + ' hs'
          : 'Fecha no registrada';

        return `
          <div class="consulta-card">
            <div class="consulta-header">
              <span class="badge-especialidad">${escapeHtml(item.especialidadNombre || 'Consulta Médica')}</span>
              <span class="fecha-hora">${escapeHtml(fechaHora)}</span>
            </div>
            
            <div class="profesional-line">
              <strong>Profesional tratante:</strong> Dr/a. ${escapeHtml(item.profesionalNombreCompleto)} 
              ${item.profesionalMatricula ? `<em>(Matrícula: ${escapeHtml(item.profesionalMatricula)})</em>` : ''} 
              • <strong>Sede:</strong> ${escapeHtml(item.sedeNombre || 'Hospital Central')}
            </div>

            ${item.motivoConsulta ? `
              <div class="item-seccion">
                <span class="label">Motivo de Consulta:</span>
                <span class="valor">"${escapeHtml(item.motivoConsulta)}"</span>
              </div>
            ` : ''}

            <div class="item-seccion">
              <span class="label">Diagnóstico Clínico:</span>
              <div class="valor-bloque">${escapeHtml(item.diagnostico || 'Sin diagnóstico registrado')}</div>
            </div>

            <div class="item-seccion">
              <span class="label">Tratamiento e Indicaciones:</span>
              <div class="valor-bloque">${escapeHtml(item.tratamiento || 'Sin indicaciones registradas')}</div>
            </div>

            ${item.recetasPrescritas ? `
              <div class="item-seccion alerta-receta">
                <span class="label">💊 Recetas / Fármacos Prescritos:</span>
                <div class="valor-mono">${escapeHtml(item.recetasPrescritas)}</div>
              </div>
            ` : ''}

            ${item.estudiosSolicitados ? `
              <div class="item-seccion alerta-estudio">
                <span class="label">🔬 Estudios Complementarios Solicitados:</span>
                <div class="valor-mono">${escapeHtml(item.estudiosSolicitados)}</div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')
    : `
      <div class="sin-registros">
        <p><strong>El paciente no registra consultas previas asentadas en el sistema hospitalario.</strong></p>
      </div>
    `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Historia Clínica - ${escapeHtml(paciente.nombreCompleto)}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          background: #ffffff;
          line-height: 1.4;
          margin: 0;
          padding: 0;
          font-size: 11pt;
        }
        .header-institucional {
          border-bottom: 2px solid #004a8a;
          padding-bottom: 10px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .titulo-gobierno {
          font-size: 13pt;
          font-weight: 900;
          color: #004a8a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
        }
        .subtitulo-ministerio {
          font-size: 9.5pt;
          color: #64748b;
          font-weight: 600;
          margin: 2px 0 0 0;
        }
        .fecha-emision {
          font-size: 8.5pt;
          color: #64748b;
          text-align: right;
        }
        .documento-titulo {
          font-size: 14pt;
          font-weight: 800;
          text-align: center;
          margin: 12px 0 16px 0;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .ficha-paciente {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 18px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 8px;
          font-size: 10pt;
        }
        .ficha-paciente strong {
          color: #0f172a;
        }
        .consulta-card {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px 14px;
          margin-bottom: 14px;
          page-break-inside: avoid;
          background: #ffffff;
        }
        .consulta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .badge-especialidad {
          font-weight: 800;
          color: #004a8a;
          font-size: 10.5pt;
        }
        .fecha-hora {
          font-size: 9pt;
          color: #475569;
          font-weight: 600;
        }
        .profesional-line {
          font-size: 9.5pt;
          color: #334155;
          margin-bottom: 8px;
        }
        .item-seccion {
          margin-top: 6px;
          font-size: 9.5pt;
        }
        .label {
          font-weight: 700;
          color: #334155;
          display: block;
          margin-bottom: 2px;
        }
        .valor {
          color: #1e293b;
        }
        .valor-bloque {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 6px 8px;
          color: #1e293b;
        }
        .alerta-receta {
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 4px;
          padding: 6px 8px;
          color: #78350f;
          margin-top: 6px;
        }
        .alerta-estudio {
          background-color: #f0f9ff;
          border: 1px solid #e0f2fe;
          border-radius: 4px;
          padding: 6px 8px;
          color: #0369a1;
          margin-top: 6px;
        }
        .valor-mono {
          font-family: monospace;
          white-space: pre-line;
          font-size: 9pt;
        }
        .sin-registros {
          text-align: center;
          padding: 25px;
          color: #64748b;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
        }
        .footer-documento {
          margin-top: 30px;
          border-top: 1px solid #cbd5e1;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 8pt;
          color: #64748b;
          page-break-inside: avoid;
        }
        .sello-firma {
          margin-top: 40px;
          text-align: center;
          width: 220px;
          border-top: 1px dashed #64748b;
          padding-top: 4px;
          font-size: 8.5pt;
        }
      </style>
    </head>
    <body>
      <div class="header-institucional">
        <div>
          <h1 class="titulo-gobierno">Gobierno de Mendoza</h1>
          <p class="subtitulo-ministerio">Ministerio de Salud y Deportes • Red Sanitaria Provincial</p>
        </div>
        <div class="fecha-emision">
          <span>Fecha de Emisión:</span><br>
          <strong>${escapeHtml(fechaEmision)}</strong>
        </div>
      </div>

      <div class="documento-titulo">HISTORIA CLÍNICA DIGITAL • EXPEDIENTE MÉDICO</div>

      <div class="ficha-paciente">
        <div>
          <span style="color:#64748b; font-size:8.5pt; display:block;">PACIENTE:</span>
          <strong>${escapeHtml(paciente.nombreCompleto)}</strong>
        </div>
        <div>
          <span style="color:#64748b; font-size:8.5pt; display:block;">DNI / DOCUMENTO:</span>
          <strong>${escapeHtml(paciente.dni)}</strong>
        </div>
        <div>
          <span style="color:#64748b; font-size:8.5pt; display:block;">COBERTURA MÉDICA:</span>
          <strong>${escapeHtml(paciente.obraSocial || 'Particular')}</strong>
        </div>
      </div>

      <div class="contenedor-consultas">
        ${consultasHtml}
      </div>

      <div class="footer-documento">
        <div>
          Documento médico digital emitido por el Sistema de Gestión de Turnos e Historias Clínicas de la Provincia de Mendoza.<br>
          La información aquí consignada tiene carácter confidencial y amparada por secreto médico.
        </div>
        <div class="sello-firma">
          Firma y Sello del Profesional Médico
        </div>
      </div>
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1500);
  }, 250);
}

function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
