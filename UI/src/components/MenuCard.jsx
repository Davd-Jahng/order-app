import { useState } from 'react'
import { formatPrice } from '../utils/formatters'

function MenuCard({ item, options, onAddToCart }) {
  const [selectedIds, setSelectedIds] = useState([])

  const toggleOption = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectedOptions = options.filter((o) => selectedIds.includes(o.id))
  const unitPrice = item.price + selectedOptions.reduce((sum, o) => sum + o.extraPrice, 0)
  const optionNames = selectedOptions.map((o) => o.name).join(', ')

  const handleAdd = () => {
    onAddToCart({
      productId: item.id,
      productName: item.name,
      optionIds: [...selectedIds].sort(),
      optionNames,
      unitPrice,
    })
    setSelectedIds([])
  }

  return (
    <article className="menu-card">
      <div className="menu-card__image">
        {item.image ? (
          <img src={item.image} alt={item.name} />
        ) : (
          <span>이미지</span>
        )}
      </div>
      <h2 className="menu-card__name">{item.name}</h2>
      <p className="menu-card__price">{formatPrice(item.price)}</p>
      <p className="menu-card__desc">{item.description}</p>
      <div className="menu-card__options">
        {options.map((opt) => (
          <label key={opt.id} className="menu-card__option">
            <input
              type="checkbox"
              checked={selectedIds.includes(opt.id)}
              onChange={() => toggleOption(opt.id)}
            />
            <span>
              {opt.name} ({opt.extraPrice > 0 ? `+${formatPrice(opt.extraPrice)}` : '+0원'})
            </span>
          </label>
        ))}
      </div>
      <button type="button" className="menu-card__btn" onClick={handleAdd}>
        담기
      </button>
    </article>
  )
}

export default MenuCard
