import { useState } from 'react'
import { useTopics } from '../hooks/useTopics'
import { Modal, Field, Input, Select, Row2 } from '../components/Modal'
import { AddBtn, Spinner, Empty } from '../components/UI'
import { CATEGORIES, STAGES, STAGE_LABELS } from '../lib/constants'

export default function Topics({ showToast }) {
  const { topics, loading, addTopic, updateTopic, deleteTopic } = useTopics()
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', category: 'finance', stage: 'ideas', hook: '', notes: '' })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleAdd() {
    if (!form.title.trim()) { showToast('Title required'); return }
    await addTopic({ title: form.title.trim(), category: form.category, stage: form.stage, hook: form.hook || null, notes: form.notes || null })
    setModal(false)
    setForm({ title: '', category: 'finance', stage: 'ideas', hook: '', notes: '' })
    showToast('Topic added')
  }

  function openEdit(topic) {
    setSelected(topic)
    setEditModal(true)
  }

  async function handleMove(topic, direction) {
    const idx = STAGES.indexOf(topic.stage)
    const nextIdx = direction === 'forward' ? idx + 1 : idx - 1
    if (nextIdx < 0 || nextIdx >= STAGES.length) return
    const nextStage = STAGES[nextIdx]
    await updateTopic(topic.id, { stage: nextStage })
    showToast(`Moved to ${STAGE_LABELS[nextStage]}`)
    setEditModal(false)
  }

  async function handleDelete() {
    if (!selected) return
    if (!window.confirm(`Delete "${selected.title}"?`)) return
    await deleteTopic(selected.id)
    setEditModal(false)
    showToast('Deleted')
  }

  if (loading) return <div className="scroll-area"><Spinner /></div>

  return (
    <div className="page-enter">
      {/* Header — outside scroll so title stays visible */}
      <div className="pipeline-hd">
        <h2 className="section-title">Topics</h2>
        <AddBtn onClick={() => setModal(true)}>＋ Add</AddBtn>
      </div>
      <p style={{ fontSize: 11, color: 'var(--t3)', padding: '2px 14px 6px' }}>
        Swipe → to see all stages · Tap a card to move it
      </p>

      {/* PIPELINE BOARD */}
      <div className="pipeline-scroll">
        {STAGES.map(stage => {
          const stageTopics = topics.filter(t => t.stage === stage)
          return (
            <div key={stage} className="pipe-col">
              <div className="pipe-col-hd">
                <span className="pipe-col-label">{STAGE_LABELS[stage]}</span>
                <span className="pipe-count">{stageTopics.length}</span>
              </div>
              {stageTopics.length === 0
                ? <div style={{ fontSize: 11, color: 'var(--t3)', padding: '6px 2px' }}>Empty</div>
                : stageTopics.map(t => {
                    const cat = CATEGORIES[t.category] || CATEGORIES.finance
                    return (
                      <div key={t.id} className="topic-card" onClick={() => openEdit(t)}>
                        <div className="topic-card-title">{t.title}</div>
                        <span className={`tag tag-${t.category}`}>{cat.label}</span>
                      </div>
                    )
                  })
              }
            </div>
          )
        })}
      </div>

      {/* ADD MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Topic">
        <Field label="Topic Title">
          <Input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Why mutual fund returns lie"
            autoFocus
          />
        </Field>
        <Row2>
          <Field label="Category">
            <Select value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="finance">Finance</option>
              <option value="psych">Psychology</option>
              <option value="macro">Macro</option>
              <option value="collab">Collab</option>
            </Select>
          </Field>
          <Field label="Stage">
            <Select value={form.stage} onChange={e => set('stage', e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </Select>
          </Field>
        </Row2>
        <Field label="Hook (optional)">
          <Input value={form.hook} onChange={e => set('hook', e.target.value)} placeholder="Opening line idea" />
        </Field>
        <Field label="Notes">
          <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Angles, references, anything" />
        </Field>
        <button className="btn btn-lime btn-full" onClick={handleAdd} style={{ marginBottom: 8 }}>
          Add to Pipeline
        </button>
        <button className="btn btn-ghost btn-full" onClick={() => setModal(false)}>Cancel</button>
      </Modal>

      {/* EDIT / MOVE MODAL */}
      {selected && (
        <Modal open={editModal} onClose={() => setEditModal(false)} title={selected.title}>
          <div style={{ marginBottom: 16 }}>
            <span className={`tag tag-${selected.category}`}>{CATEGORIES[selected.category]?.label}</span>
            <span style={{ fontSize: 12, color: 'var(--t2)', marginLeft: 8 }}>
              Stage: {STAGE_LABELS[selected.stage]}
            </span>
          </div>
          {selected.hook && (
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Hook</div>
              <div style={{ fontSize: 13, color: 'var(--t1)' }}>{selected.hook}</div>
            </div>
          )}
          {selected.notes && (
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 13, color: 'var(--t2)' }}>{selected.notes}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {STAGES.indexOf(selected.stage) > 0 && (
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => handleMove(selected, 'back')}>
                ← Back
              </button>
            )}
            {STAGES.indexOf(selected.stage) < STAGES.length - 1 && (
              <button className="btn btn-lime" style={{ flex: 1 }} onClick={() => handleMove(selected, 'forward')}>
                Move → {STAGE_LABELS[STAGES[STAGES.indexOf(selected.stage) + 1]]}
              </button>
            )}
          </div>
          <button className="btn btn-danger btn-full" onClick={handleDelete} style={{ marginBottom: 8 }}>
            Delete Topic
          </button>
          <button className="btn btn-ghost btn-full" onClick={() => setEditModal(false)}>Close</button>
        </Modal>
      )}
    </div>
  )
}
