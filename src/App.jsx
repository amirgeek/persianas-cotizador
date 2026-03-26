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
  { id: 'solo-compra', title: 'Solo compra', subtitle: 'Fabricamos la persiana y vos resolvés la colocación.' },
  { id: 'compra-instalacion', title: 'Compra + instalación', subtitle: 'Nos encargamos de la provisión y la instalación.' },
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [form, setForm] = useState({
    workType: '',
    installMode: '',
    actionMode: '',
    windows: initialWindows,
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

  const whatsappHref = `https://wa.me/5492236688267?text=${encodeURIComponent(whatsappText)}`;

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

  const resetAndClose = () => {
    setIsModalOpen(false);
    setIsResultOpen(false);
    setForm({ workType: '', installMode: '', actionMode: '', windows: initialWindows });
  };

  const goBack = () => {
    if (isResultOpen) {
      setIsResultOpen(false);
      return;
    }
    if (form.actionMode) {
      setForm((current) => ({ ...current, actionMode: '' }));
      return;
    }
    if (needsInstallMode && form.installMode) {
      setForm((current) => ({ ...current, installMode: '' }));
      return;
    }
    if (form.workType) {
      setForm((current) => ({ ...current, workType: '' }));
    }
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">PERSIANAS</div>
        <button className="nav-button" onClick={() => { setIsModalOpen(true); setIsResultOpen(false); }}>Cotizar</button>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">Cotización simple y rápida</div>
            <h1>Persianas a medida, con una experiencia de cotización clara.</h1>
            <p>
              Mostrá tu servicio como algo serio: una landing limpia, un flujo guiado y una cotización estimada que el cliente puede enviar por WhatsApp en minutos.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => { setIsModalOpen(true); setIsResultOpen(false); }}>Cotizar ahora</button>
              <a className="secondary-link" href="#como-funciona">Cómo funciona</a>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-top">Estimación en tiempo real</div>
            <div className="fake-quote-value">{formatCurrency(totals.total || 486000)}</div>
            <div className="hero-card-list">
              <span>Obra, recambio o cajón exterior</span>
              <span>Manual o motorizada</span>
              <span>Medidas por abertura</span>
              <span>Envío directo por WhatsApp</span>
            </div>
          </div>
        </section>

        <section className="features-section" id="como-funciona">
          <div className="section-heading">
            <div className="eyebrow">Cómo funciona</div>
            <h2>Un flujo pensado para que cotizar no sea un dolor.</h2>
          </div>
          <div className="features-grid">
            <FeatureCard number="01" title="Elegís el tipo de trabajo" text="Obra, recambio o cajón exterior. Sin vueltas ni pantallas técnicas de más." />
            <FeatureCard number="02" title="Definís el sistema" text="Manual o motorizado, y si aplica, solo compra o compra con instalación." />
            <FeatureCard number="03" title="Cargás medidas" text="Una abertura por vez, con una experiencia mucho más simple que una planilla." />
            <FeatureCard number="04" title="Mandás la cotización" text="El resultado final sale listo para compartir por WhatsApp al instante." />
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={resetAndClose}>
          <div className="modal-shell" onClick={(e) => e.stopPropagation()}>
            <div className="modal-topbar">
              <div>
                <div className="eyebrow">Cotizador paso a paso</div>
                <h2>Respondé estas preguntas y te damos un precio estimado</h2>
              </div>
              <button className="close-button" onClick={resetAndClose}>✕</button>
            </div>

            <div className="modal-layout">
              <section className="modal-main">
                <div className="step-pill">Paso {step}</div>

                {!form.workType && (
                  <div className="stack">
                    <h3>Primero: elegí qué necesitás</h3>
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
                    <button className="back-link" onClick={goBack}>← Volver</button>
                    <h3>Ahora elegí cómo querés hacerlo</h3>
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
                    <button className="back-link" onClick={goBack}>← Volver</button>
                    <h3>¿La querés manual o motorizada?</h3>
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
                    <button className="back-link" onClick={goBack}>← Volver</button>
                    <h3>Último paso: cargá las medidas</h3>
                    <p className="section-copy">Escribí el ancho y el alto de cada ventana en metros. Ejemplo: 1.50 de ancho y 1.20 de alto.</p>
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

                    <div className="actions-row stacked-actions">
                      <button className="secondary-button" onClick={addWindow}>+ Agregar otra ventana</button>
                      {canFinish && (
                        <button className="primary-button full-width big-continue" onClick={() => setIsResultOpen(true)}>
                          Ver mi cotización
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {canFinish && (
                <aside className="summary-panel white-summary compact-summary">
                  <div className="summary-top">
                    <span className="eyebrow">Listo</span>
                    <h3>Ya está todo cargado</h3>
                  </div>

                  <p className="section-copy">Tocá el botón negro para ver el precio estimado y seguir por WhatsApp.</p>

                  <button className="primary-button full-width" onClick={() => setIsResultOpen(true)}>
                    Ver mi cotización
                  </button>
                </aside>
              )}
            </div>
          </div>
        </div>
      )}

      {isResultOpen && canFinish && (
        <div className="modal-backdrop result-backdrop" onClick={() => setIsResultOpen(false)}>
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-topbar result-topbar">
              <div>
                <div className="eyebrow">Resultado</div>
                <h2>Tu cotización estimada</h2>
              </div>
              <button className="close-button" onClick={() => setIsResultOpen(false)}>✕</button>
            </div>

            <div className="summary-list">
              <SummaryItem label="Tipo de trabajo" value={workTypes.find((item) => item.id === form.workType)?.title} />
              {needsInstallMode && <SummaryItem label="Modalidad" value={installChoices.find((item) => item.id === form.installMode)?.title} />}
              <SummaryItem label="Accionamiento" value={modes.find((item) => item.id === form.actionMode)?.title} />
              <SummaryItem label="Aberturas" value={String(form.windows.length)} />
              <SummaryItem label="Superficie total" value={`${totals.totalSqm.toFixed(2)} m²`} />
            </div>

            <div className="result-total-box">
              <span className="mini-label">Estimado</span>
              <div className="total-value">{formatCurrency(totals.total)}</div>
              <p>Valor orientativo según las medidas cargadas.</p>
            </div>

            <a className="primary-button full-width" href={whatsappHref} target="_blank" rel="noreferrer">
              Continuar por WhatsApp
            </a>

            <div className="note-box light-note">
              Prototipo con costos inventados para validar la UX. Después se ajusta con precios reales.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ number, title, text }) {
  return (
    <article className="feature-card">
      <span className="feature-number">{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
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
