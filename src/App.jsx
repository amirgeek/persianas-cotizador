import { useMemo, useState } from 'react';

const workTypes = [
  {
    id: 'obra',
    title: 'Estoy construyendo',
    subtitle: 'La casa todavía está en obra y quiero colocar persianas.',
  },
  {
    id: 'recambio',
    title: 'Quiero renovar una persiana',
    subtitle: 'Ya tengo persiana y necesito hacer un recambio.',
  },
  {
    id: 'cajon-exterior',
    title: 'Mi casa ya está terminada y no tiene persiana',
    subtitle: 'Necesito una solución con cajón exterior.',
  },
];

const modes = [
  { id: 'manual', title: 'Manual', subtitle: 'Accionamiento con cinta o manivela.' },
  { id: 'motor', title: 'Motorizada', subtitle: 'Más comodidad y mejor terminación.' },
];

const installChoices = [
  { id: 'solo-compra', title: 'Solo compra', subtitle: 'Nosotros fabricamos, vos instalás.' },
  { id: 'compra-instalacion', title: 'Compra + instalación', subtitle: 'Nos encargamos de todo.' },
];

const pricing = {
  obra: {
    'solo-compra': { manual: 120000, motor: 185000 },
    'compra-instalacion': { manual: 145000, motor: 210000 },
  },
  recambio: {
    default: { manual: 160000, motor: 225000 },
  },
  'cajon-exterior': {
    default: { manual: 190000, motor: 255000 },
  },
};

const initialWindows = [{ width: '', height: '' }];

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function App() {
  const [form, setForm] = useState({
    workType: '',
    installMode: '',
    actionMode: '',
    windows: initialWindows,
    name: '',
    phone: '',
  });

  const needsInstallMode = form.workType === 'obra';

  const step = useMemo(() => {
    if (!form.workType) return 1;
    if (needsInstallMode && !form.installMode) return 2;
    if (!form.actionMode) return needsInstallMode ? 3 : 2;
    return needsInstallMode ? 4 : 3;
  }, [form, needsInstallMode]);

  const rate = useMemo(() => {
    if (!form.workType || !form.actionMode) return 0;
    if (form.workType === 'obra') {
      if (!form.installMode) return 0;
      return pricing.obra[form.installMode]?.[form.actionMode] || 0;
    }
    return pricing[form.workType]?.default?.[form.actionMode] || 0;
  }, [form]);

  const totals = useMemo(() => {
    const detailed = form.windows.map((item, index) => {
      const width = Number(String(item.width).replace(',', '.')) || 0;
      const height = Number(String(item.height).replace(',', '.')) || 0;
      const sqm = width > 0 && height > 0 ? width * height : 0;
      return { index, width, height, sqm, subtotal: sqm * rate };
    });

    const totalSqm = detailed.reduce((acc, item) => acc + item.sqm, 0);
    const total = detailed.reduce((acc, item) => acc + item.subtotal, 0);

    return { detailed, totalSqm, total };
  }, [form.windows, rate]);

  const canFinish = totals.totalSqm > 0 && rate > 0;

  const whatsappText = useMemo(() => {
    const workLabel = workTypes.find((item) => item.id === form.workType)?.title || '-';
    const installLabel = installChoices.find((item) => item.id === form.installMode)?.title || 'No aplica';
    const actionLabel = modes.find((item) => item.id === form.actionMode)?.title || '-';
    const windowsText = totals.detailed
      .filter((item) => item.sqm > 0)
      .map((item, idx) => `Ventana ${idx + 1}: ${item.width}m x ${item.height}m (${item.sqm.toFixed(2)} m²)`)
      .join('\n');

    return [
      'Hola, quiero enviar esta cotización estimada de persianas:',
      '',
      `Tipo de trabajo: ${workLabel}`,
      needsInstallMode ? `Modalidad: ${installLabel}` : null,
      `Accionamiento: ${actionLabel}`,
      '',
      'Medidas:',
      windowsText || '-',
      '',
      `Superficie total: ${totals.totalSqm.toFixed(2)} m²`,
      `Valor estimado: ${formatCurrency(totals.total)}`,
      '',
      'Aclaro que es una cotización estimada generada desde el cotizador web.',
    ]
      .filter(Boolean)
      .join('\n');
  }, [form, totals, needsInstallMode]);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const updateWindow = (index, key, value) => {
    setForm((current) => ({
      ...current,
      windows: current.windows.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    }));
  };

  const addWindow = () => {
    setForm((current) => ({ ...current, windows: [...current.windows, { width: '', height: '' }] }));
  };

  const removeWindow = (index) => {
    setForm((current) => ({
      ...current,
      windows: current.windows.length === 1 ? current.windows : current.windows.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <main className="layout">
        <section className="panel main-panel">
          <div className="eyebrow">Cotizador interactivo</div>
          <h1>Cotizá persianas en minutos</h1>
          <p className="intro">
            Elegí el tipo de trabajo, definí si la querés manual o motorizada, cargá las medidas y obtené un valor estimado al instante.
          </p>

          <div className="step-pill">Paso {step}</div>

          {!form.workType && (
            <div className="stack">
              <h2>¿Qué necesitás?</h2>
              <div className="grid cards-grid">
                {workTypes.map((item) => (
                  <button
                    key={item.id}
                    className="choice-card"
                    onClick={() => setForm((current) => ({ ...current, workType: item.id }))}
                  >
                    <span className="choice-title">{item.title}</span>
                    <span className="choice-subtitle">{item.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.workType && needsInstallMode && !form.installMode && (
            <div className="stack">
              <button className="back-link" onClick={() => setForm((current) => ({ ...current, workType: '', installMode: '', actionMode: '' }))}>← Volver</button>
              <h2>¿Cómo querés resolverlo?</h2>
              <div className="grid cards-grid two-columns">
                {installChoices.map((item) => (
                  <button
                    key={item.id}
                    className="choice-card"
                    onClick={() => setForm((current) => ({ ...current, installMode: item.id }))}
                  >
                    <span className="choice-title">{item.title}</span>
                    <span className="choice-subtitle">{item.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.workType && (!needsInstallMode || form.installMode) && !form.actionMode && (
            <div className="stack">
              <button className="back-link" onClick={() => setForm((current) => ({ ...current, actionMode: '', installMode: needsInstallMode ? '' : current.installMode }))}>← Volver</button>
              <h2>¿Cómo la querés accionar?</h2>
              <div className="grid cards-grid two-columns">
                {modes.map((item) => (
                  <button
                    key={item.id}
                    className="choice-card"
                    onClick={() => setForm((current) => ({ ...current, actionMode: item.id }))}
                  >
                    <span className="choice-title">{item.title}</span>
                    <span className="choice-subtitle">{item.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.workType && (!needsInstallMode || form.installMode) && form.actionMode && (
            <div className="stack">
              <button className="back-link" onClick={() => setForm((current) => ({ ...current, actionMode: '' }))}>← Volver</button>
              <h2>Cargá las medidas</h2>
              <p className="section-copy">Ingresá ancho y alto en metros por cada abertura.</p>
              <div className="windows-list">
                {form.windows.map((item, index) => (
                  <div key={index} className="window-card">
                    <div className="window-header">
                      <strong>Abertura {index + 1}</strong>
                      {form.windows.length > 1 && (
                        <button className="ghost-button" onClick={() => removeWindow(index)}>Eliminar</button>
                      )}
                    </div>
                    <div className="measure-grid">
                      <label>
                        <span>Ancho (m)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Ej: 1.50"
                          value={item.width}
                          onChange={(e) => updateWindow(index, 'width', e.target.value)}
                        />
                      </label>
                      <label>
                        <span>Alto (m)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Ej: 1.20"
                          value={item.height}
                          onChange={(e) => updateWindow(index, 'height', e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="window-meta">
                      Superficie: <strong>{totals.detailed[index]?.sqm?.toFixed(2) || '0.00'} m²</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="actions-row">
                <button className="secondary-button" onClick={addWindow}>+ Agregar otra abertura</button>
              </div>

              <div className="result-card">
                <div>
                  <span className="mini-label">Precio estimado</span>
                  <h3>{formatCurrency(totals.total)}</h3>
                  <p>Valor orientativo según las medidas cargadas.</p>
                </div>
                <a className={`primary-button ${!canFinish ? 'disabled' : ''}`} href={canFinish ? whatsappHref : undefined} target="_blank" rel="noreferrer">
                  Enviar cotización por WhatsApp
                </a>
              </div>
            </div>
          )}
        </section>

        <aside className="panel summary-panel">
          <div className="summary-top">
            <span className="eyebrow">Resumen</span>
            <h2>Tu cotización</h2>
          </div>

          <div className="summary-list">
            <SummaryItem label="Tipo de trabajo" value={workTypes.find((item) => item.id === form.workType)?.title} />
            {needsInstallMode && <SummaryItem label="Modalidad" value={installChoices.find((item) => item.id === form.installMode)?.title} />}
            <SummaryItem label="Accionamiento" value={modes.find((item) => item.id === form.actionMode)?.title} />
            <SummaryItem label="Aberturas" value={String(form.windows.length)} />
            <SummaryItem label="Superficie total" value={totals.totalSqm ? `${totals.totalSqm.toFixed(2)} m²` : ''} />
          </div>

          <div className="summary-total">
            <span className="mini-label">Estimado</span>
            <div className="total-value">{formatCurrency(totals.total)}</div>
          </div>

          <div className="note-box">
            Precios inventados para prototipo UX/UI. Después se reemplazan por la lógica real de negocio.
          </div>
        </aside>
      </main>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  );
}

export default App;
