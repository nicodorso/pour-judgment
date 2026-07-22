const COLOR_META = {
  red: {
    label: 'Red',
    sliders: [
      { key: 'fruitCharacter', label: 'Fruit character', left: 'Earthy & savory', right: 'Juicy & fruit-forward' },
      { key: 'texture', label: 'Texture', left: 'Smooth & silky', right: 'Dry & grippy' },
      { key: 'weight', label: 'Weight', left: 'Light & easy', right: 'Rich & full' },
    ]
  },
  white: {
    label: 'White',
    sliders: [
      { key: 'acidity', label: 'Acidity', left: 'Soft & mellow', right: 'Bright & zippy' },
      { key: 'minerality', label: 'Minerality', left: 'Round & fruity', right: 'Stony / flinty' },
      { key: 'sweetness', label: 'Sweetness', left: 'Bone dry', right: 'Noticeably sweet' },
      { key: 'weight', label: 'Weight', left: 'Light & easy', right: 'Rich & full' },
      { key: 'oak', label: 'Oak influence', left: 'Clean & fresh', right: 'Buttery & toasty' },
    ]
  },
  rose: {
    label: 'Rosé',
    sliders: [
      { key: 'acidity', label: 'Acidity', left: 'Soft & mellow', right: 'Bright & zippy' },
      { key: 'sweetness', label: 'Sweetness', left: 'Bone dry', right: 'Noticeably sweet' },
      { key: 'weight', label: 'Weight', left: 'Light & easy', right: 'Rich & full' },
    ]
  },
  sparkling: {
    label: 'Sparkling',
    sliders: [
      { key: 'sweetness', label: 'Dryness', left: 'Bone dry (Brut)', right: 'Off-dry / sweet' },
    ]
  },
  orange: {
    label: 'Orange',
    sliders: [
      { key: 'acidity', label: 'Acidity', left: 'Soft & mellow', right: 'Bright & zippy' },
      { key: 'texture', label: 'Texture', left: 'Smooth & silky', right: 'Dry & grippy' },
    ]
  }
}

function sliderPosition(val) {
  // maps -2..2 to a 0-100% left position for a simple readout dot
  return ((val + 2) / 4) * 100
}

function ColorSection({ colorKey, meta, data, answered, onReset }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="h2">{meta.label}</div>
        {answered && (
          <button
            className="body-text"
            style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'var(--bone-dim)', fontSize: 12 }}
            onClick={() => onReset(colorKey)}
          >
            Reset
          </button>
        )}
      </div>

      {!answered && (
        <p className="body-text" style={{ marginTop: 10, fontSize: 13 }}>
          Not asked yet — pick "{meta.label}" as your mood on a scan to answer these.
        </p>
      )}

      {answered && (
        <>
          {(data.loved || data.avoided) && (
            <div style={{ marginTop: 12, marginBottom: 6 }}>
              {data.loved && <p className="note" style={{ marginBottom: 8 }}>Loves: {data.loved}</p>}
              {data.avoided && <p className="note" style={{ borderLeftColor: 'var(--claret)', color: 'var(--claret)' }}>Avoids: {data.avoided}</p>}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            {meta.sliders.map(s => (
              <div key={s.key}>
                <div className="body-text" style={{ fontSize: 12, color: 'var(--bone-dim)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{s.label}</span>
                </div>
                <div style={{ position: 'relative', height: 4, background: 'rgba(30,42,34,0.12)', borderRadius: 2, marginTop: 6 }}>
                  <div style={{
                    position: 'absolute', top: -3, left: `calc(${sliderPosition(data[s.key] ?? 0)}% - 5px)`,
                    width: 10, height: 10, borderRadius: '50%', background: 'var(--copper)'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--bone-dim)', fontFamily: 'var(--mono)', marginTop: 4 }}>
                  <span>{s.left}</span>
                  <span>{s.right}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Profile({ profile, onBack, onReset }) {
  return (
    <div className="screen">
      <button
        className="body-text"
        style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'var(--bone-dim)', fontSize: 13, textAlign: 'left', marginBottom: 16 }}
        onClick={onBack}
      >
        ← Back
      </button>
      <div className="eyebrow">Your profile</div>
      <h1 className="h1" style={{ marginTop: 10, marginBottom: 20 }}>What we know so far.</h1>

      {Object.entries(COLOR_META).map(([key, meta]) => (
        <ColorSection
          key={key}
          colorKey={key}
          meta={meta}
          data={profile.colorTraits[key]}
          answered={profile.answeredColors[key]}
          onReset={onReset}
        />
      ))}

      <p className="body-text" style={{ fontSize: 12, marginTop: 8 }}>
        Editing individual answers isn't supported yet — reset a color to retake just that one.
      </p>
    </div>
  )
}
