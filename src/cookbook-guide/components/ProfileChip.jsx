// Picture, name and a line under it, with the person's chosen banner and hat
// (Account Settings). Used on places, recipes and the settings preview.
export default function ProfileChip({ name, sub, avatarUrl, avatar = '👤', color = '#E8E4DC', banner = 'default', hat = false, style }) {
  return (
    <div className={`panel-recommender banner-${banner}`} style={style}>
      <div className={`rec-avatar${hat ? ' has-hat' : ''}`} style={{ background: color }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        ) : (
          avatar
        )}
      </div>
      <div className="rec-info">
        <div className="rec-name">{name}</div>
        {sub && <div className="rec-role">{sub}</div>}
      </div>
    </div>
  );
}
