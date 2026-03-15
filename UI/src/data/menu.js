/**
 * 커피 메뉴 및 옵션 데이터 (PRD 기준)
 */
export const MENU_ITEMS = [
  {
    id: 'americano-hot',
    name: '아메리카노(HOT)',
    price: 4000,
    description: '따뜻한 에스프레소에 뜨거운 물을 더한 클래식 커피',
    image: '/images/americano-hot.jpg',
  },
  {
    id: 'americano-ice',
    name: '아메리카노(ICE)',
    price: 4000,
    description: '시원한 에스프레소에 얼음과 물을 더한 커피',
    image: '/images/americano-ice.jpg',
  },
  {
    id: 'caffe-latte',
    name: '카페라떼',
    price: 5000,
    description: '에스프레소와 스팀 밀크가 어우러진 부드러운 라떼',
    image: '/images/caffe-latte.jpg',
  },
]

export const OPTIONS = [
  { id: 'shot', name: '샷 추가', extraPrice: 500 },
  { id: 'syrup', name: '시럽 추가', extraPrice: 0 },
]
