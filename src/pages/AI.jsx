import { AI_TOOLS } from '../lib/constants'

export default function AI() {
  function launch(tool) {
    const url = 'https://claude.ai/new?q=' + encodeURIComponent(tool.prompt)
    window.open(url, '_blank')
  }

  return (
    <div className="scroll-area page-enter">
      <div className="section-hd" style={{ marginBottom: 4 }}>
        <h2 className="section-title">AI Tools</h2>
      </div>
      <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 16 }}>
        Tap any tool to open Claude with the right prompt pre-loaded
      </p>
      <div className="launcher-grid">
        {AI_TOOLS.map(tool => (
          <button key={tool.key} className="launcher" onClick={() => launch(tool)}>
            <span className="launcher-arrow">↗</span>
            <div className="launcher-icon">{tool.icon}</div>
            <div className="launcher-name">{tool.name}</div>
            <div className="launcher-desc">{tool.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
