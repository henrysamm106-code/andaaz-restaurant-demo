export interface MenuCategory {
  name: string;
  summary: string;
  items: string[];
}

export interface MenuDish {
  name: string;
  description: string;
  printedPrice: number;
}

export interface FullMenuSection {
  id: string;
  pageNumber: 1 | 2 | 3;
  name: string;
  englishLabel: string;
  subtitle: string;
  spiceNote?: string;
  items: MenuDish[];
}

export interface OfficialMenuPage {
  pageNumber: 1 | 2 | 3;
  title: string;
  sectionsLabel: string;
  localPath: string;
  alt: string;
  caption: string;
}

export const MENU_META = {
  source: 'https://andaazrestaurant.com/andaaz-menu',
  verifiedOn: '2026-11-25',
  spiceNote: 'Spice levels can be adjusted to your preference. Please let your server know.',
  scopeNote:
    'Browse all six courses transcribed from the three original Andaaz menu sheets alongside high-resolution views of the printed menu pages.',
  priceNote:
    'Figures shown alongside dishes reflect the printed numbers on the scanned three-page official menu (no currency symbol or tax rate is printed on those sheets). Current pricing, applicable taxes, availability, and allergen details must be confirmed directly with the restaurant.',
} as const;

export const OFFICIAL_MENU_PAGES: OfficialMenuPage[] = [
  {
    pageNumber: 1,
    title: 'Page 1 — Tandoor & Karahi',
    sectionsLabel: 'Tandoori Namonay · Karahi Kay Kamal',
    localPath: '/assets/menu/andaaz-menu-page-1.jpg',
    alt: 'Original Page 1 of the printed Andaaz Restaurant menu featuring Tandoori Namonay and Karahi Kay Kamal.',
    caption: 'Printed menu sheet 1 of 3: Charcoal tandoor specialties and slow-cooked karahi dishes.',
  },
  {
    pageNumber: 2,
    title: 'Page 2 — Accompaniments & Beverages',
    sectionsLabel: 'Diigar Lawazmaat · Mashrubaat',
    localPath: '/assets/menu/andaaz-menu-page-2.jpg',
    alt: 'Original Page 2 of the printed Andaaz Restaurant menu featuring Diigar Lawazmaat and Mashrubaat.',
    caption: 'Printed menu sheet 2 of 3: Vegetables, lentils, rice, breads, raita, salads, and house coolers.',
  },
  {
    pageNumber: 3,
    title: 'Page 3 — Desserts & Teas',
    sectionsLabel: 'Khaas Meetha · Garam Mashrubaat',
    localPath: '/assets/menu/andaaz-menu-page-3.jpg',
    alt: 'Original Page 3 of the printed Andaaz Restaurant menu featuring Khaas Meetha and Garam Mashrubaat.',
    caption: 'Printed menu sheet 3 of 3: Traditional Pakistani sweets, kulfi, and hand-crafted teas and coffee.',
  },
];

export const FULL_MENU_SECTIONS: FullMenuSection[] = [
  {
    id: 'tandoori-namonay',
    pageNumber: 1,
    name: 'Tandoori Namonay',
    englishLabel: 'From the Tandoor',
    subtitle: 'Cooked in the tandoor and served for sharing.',
    spiceNote: MENU_META.spiceNote,
    items: [
      {
        name: 'Tandoori Mela',
        description: 'A selection of meats and vegetables prepared for the table.',
        printedPrice: 9900,
      },
      {
        name: 'Tandoori Jhinga',
        description: 'Jumbo prawns marinated and cooked over live fire.',
        printedPrice: 4900,
      },
      {
        name: 'Macchli Gulnar',
        description: 'Fish marinated with tamarind and spices.',
        printedPrice: 3900,
      },
      {
        name: 'Masala Chanp',
        description: 'Double-cut mutton chops marinated overnight.',
        printedPrice: 6500,
      },
      {
        name: 'Lucknow Kabab',
        description: 'Minced mutton kababs gently prepared.',
        printedPrice: 6900,
      },
      {
        name: 'Raan Nawabi',
        description: 'Whole leg of lamb marinated with spices and slow-cooked.',
        printedPrice: 9900,
      },
      {
        name: 'Kandahar Kabab',
        description: 'Beef tenderloin prepared with seasonal vegetables.',
        printedPrice: 3900,
      },
      {
        name: 'Seekh Lahori',
        description: 'Minced beef kababs seasoned and shaped by hand.',
        printedPrice: 3600,
      },
      {
        name: 'Bewazni Paneer Tikka',
        description: 'House-made cottage cheese marinated with spices.',
        printedPrice: 3900,
      },
      {
        name: 'Murgh Kabab Badami',
        description: 'Minced chicken marinated with almonds and spices.',
        printedPrice: 3300,
      },
      {
        name: 'Murgh Malai Tikka',
        description: 'Chicken breast marinated with cream and spices.',
        printedPrice: 3100,
      },
      {
        name: 'Til Tikka',
        description: 'Murgh Malai Tikka finished with sesame.',
        printedPrice: 3300,
      },
    ],
  },
  {
    id: 'karahi-kay-kamal',
    pageNumber: 1,
    name: 'Karahi Kay Kamal',
    englishLabel: 'Slow-Cooked Karahis',
    subtitle: 'Slow-cooked dishes that deepen as the meal unfolds.',
    spiceNote: MENU_META.spiceNote,
    items: [
      {
        name: 'Jhinga Karahi',
        description: 'Prawns simmered in a roasted tomato base.',
        printedPrice: 3900,
      },
      {
        name: 'Jhinga Hara Masala',
        description: 'Prawns cooked with green herbs and gentle spices.',
        printedPrice: 3900,
      },
      {
        name: 'Pakoras of The Sea',
        description: 'Seafood fritters cooked and finished in a light masala.',
        printedPrice: 4300,
      },
      {
        name: 'Mutton Shank Achari',
        description: 'Mutton shank braised with pickling spices.',
        printedPrice: 6600,
      },
      {
        name: 'Chanp Bhuna',
        description: 'Mutton chops cooked slowly until the masala settles.',
        printedPrice: 5500,
      },
      {
        name: 'Maghaz Masala',
        description: 'Brain simmered with onions, spices, and ginger.',
        printedPrice: 5500,
      },
      {
        name: 'Bhuna Gosht',
        description: 'Meat cooked slowly in its own juices and spices.',
        printedPrice: 6600,
      },
      {
        name: 'Murgh Kali Mirch',
        description: 'Chicken simmered with black pepper and cream.',
        printedPrice: 3300,
      },
      {
        name: 'Chooza Makhani',
        description: 'Chicken cooked gently in a tomato and butter gravy.',
        printedPrice: 3600,
      },
      {
        name: 'Murgh Tikka Masala',
        description: 'Grilled chicken folded into a spiced tomato base.',
        printedPrice: 3300,
      },
      {
        name: 'Nizami Murgh Kaju',
        description: 'Chicken simmered with cashews and mild spices.',
        printedPrice: 3600,
      },
      {
        name: 'Murgh Vindaloo',
        description: 'Chicken cooked with vinegar, garlic, and spices.',
        printedPrice: 3300,
      },
      {
        name: 'Murgh Karahi Pudinay Wali',
        description: 'Chicken cooked with fresh mint and spices.',
        printedPrice: 3300,
      },
    ],
  },
  {
    id: 'diigar-lawazmaat',
    pageNumber: 2,
    name: 'Diigar Lawazmaat',
    englishLabel: 'Vegetables, Rice & Breads',
    subtitle: 'Rice, vegetables, legumes, fresh salads & natural breads to accompany your meals.',
    spiceNote: MENU_META.spiceNote,
    items: [
      {
        name: 'Sabzi Karahi',
        description: 'Seasonal vegetables cooked together in a spiced tomato base.',
        printedPrice: 2100,
      },
      {
        name: 'Palak Paneer',
        description: 'Spinach and mustard greens cooked with house-made cottage cheese.',
        printedPrice: 2200,
      },
      {
        name: 'Baingan ka Bharta',
        description: 'Charred eggplant cooked with onions and spices.',
        printedPrice: 2100,
      },
      {
        name: 'Tamatar ka Kut',
        description: 'Tomatoes cooked down with fenugreek and spices.',
        printedPrice: 2100,
      },
      {
        name: 'Mirchi ka Salan',
        description: 'Green chilies simmered in a nutty tangy masala.',
        printedPrice: 2200,
      },
      {
        name: 'Mushroom Curry',
        description: 'Mushrooms cooked gently with tomatoes and spices.',
        printedPrice: 2400,
      },
      {
        name: 'Daal Makhani',
        description: 'Black lentils cooked slowly with butter and spices.',
        printedPrice: 2200,
      },
      {
        name: 'Khatti Daal',
        description: 'Split lentils cooked with tamarind and curry leaf.',
        printedPrice: 2100,
      },
      {
        name: 'Nimbu Pulao',
        description: 'Basmati rice cooked with lemon and spices.',
        printedPrice: 2100,
      },
      {
        name: 'Yakhni Pulao',
        description: 'Basmati rice cooked in a light mutton broth.',
        printedPrice: 2300,
      },
      {
        name: 'Kaju Biryani',
        description: 'Rice cooked with cashews, fried onions, and herbs.',
        printedPrice: 2300,
      },
      {
        name: 'Ajwaini Roti',
        description: 'Whole wheat flatbread cooked in the tandoor.',
        printedPrice: 130,
      },
      {
        name: 'Sourdough Kulcha',
        description: 'Naturally leavened bread baked in the tandoor.',
        printedPrice: 220,
      },
      {
        name: 'Tandori Pratha',
        description: 'Layered flatbread finished with ghee.',
        printedPrice: 290,
      },
      {
        name: 'Stuffed Naan',
        description: 'Naan filled with cheese, mince or mushroom masala.',
        printedPrice: 1220,
      },
      {
        name: 'Naan',
        description: 'Leavened bread baked in the tandoor. Have it flavored with butter, garlic, onion seeds or fresh herbs.',
        printedPrice: 270,
      },
      {
        name: 'Kheera Raita',
        description: 'Hung yogurt dip with pomegranate seed, raisins & crushed cucumber.',
        printedPrice: 590,
      },
      {
        name: 'Pudina Raita',
        description: 'Natural yogurt infused with green masala chutney.',
        printedPrice: 550,
      },
      {
        name: 'Sabzi Achaar',
        description: 'Assortment of seasonal vegetables in vinegar & pickling spices.',
        printedPrice: 510,
      },
      {
        name: 'Pyaz ki Salaad',
        description: 'Crunchy onion rings tossed with fresh lemon juice and coriander vinaigrette.',
        printedPrice: 370,
      },
      {
        name: 'Kachumber Salaad',
        description: 'Thick seasonal vegetables — lemon & black pepper vinaigrette.',
        printedPrice: 390,
      },
    ],
  },
  {
    id: 'mashrubaat',
    pageNumber: 2,
    name: 'Mashrubaat',
    englishLabel: 'Chilled Beverages',
    subtitle: 'An assortment of home-made sherbets, smoothies & digestive beverages.',
    items: [
      {
        name: 'Lassi',
        description: 'Sweet or saltish yogurt & spice smoothie.',
        printedPrice: 510,
      },
      {
        name: 'Nimbu Soda',
        description: 'Freshly squeezed lemon juice with cumin masala & club soda.',
        printedPrice: 510,
      },
      {
        name: 'Nimbu Pani',
        description: 'Zesty lemonade sweetened with honey sea salt masala mix.',
        printedPrice: 490,
      },
      {
        name: 'Jal Jeera',
        description: 'Sherbet made with tamarind, cumin, mint and lemon sweetened by natural brown sugar.',
        printedPrice: 510,
      },
      {
        name: 'Pani',
        description: '(330 ml) Chilled bottled water.',
        printedPrice: 220,
      },
      {
        name: 'Sparkling Water',
        description: '(330 ml) Carbonated bottled water.',
        printedPrice: 330,
      },
      {
        name: 'Thandii Botal',
        description: 'An assortment of chilled carbonated beverages.',
        printedPrice: 390,
      },
    ],
  },
  {
    id: 'khaas-meetha',
    pageNumber: 3,
    name: 'Khaas Meetha',
    englishLabel: 'Desserts',
    subtitle: 'A selection of the finest, decadent sweet delicacies of Pakistan.',
    items: [
      {
        name: 'Jalebi Garam',
        description: 'An unhurried close to the meal.',
        printedPrice: 550,
      },
      {
        name: 'Gulab Jamon',
        description: 'Milk dumplings in light sugar syrup.',
        printedPrice: 530,
      },
      {
        name: 'Firni',
        description: 'Rice pudding finished with nuts.',
        printedPrice: 510,
      },
      {
        name: 'Halwa',
        description: 'Traditional halwa prepared with seasonal ingredients.',
        printedPrice: 550,
      },
      {
        name: 'Dahi ki Kheer',
        description: 'Set yogurt and milk dessert finished with nuts.',
        printedPrice: 550,
      },
      {
        name: 'Fruit mai Kulfi',
        description: 'Kulfi prepared with fruit and nuts.',
        printedPrice: 550,
      },
      {
        name: 'Shahi Tukra',
        description: 'Fried bread layered with reduced milk and nuts.',
        printedPrice: 590,
      },
    ],
  },
  {
    id: 'garam-mashrubaat',
    pageNumber: 3,
    name: 'Garam Mashrubaat',
    englishLabel: 'Teas & Coffee',
    subtitle: 'A selection of hand-crafted premium teas, coffees and digestives.',
    items: [
      {
        name: 'Kehwa',
        description: 'Green tea brewed with cardamom and mint.',
        printedPrice: 490,
      },
      {
        name: 'Karak Chai',
        description: 'Black tea simmered with milk.',
        printedPrice: 490,
      },
      {
        name: 'Kashmiri Chai',
        description: 'Pink tea prepared with milk and nuts.',
        printedPrice: 490,
      },
      {
        name: 'Masala Chai',
        description: 'Black tea brewed with warming spices.',
        printedPrice: 490,
      },
      {
        name: 'Podina Chai',
        description: 'Tea brewed with mint and ginger.',
        printedPrice: 490,
      },
      {
        name: 'Elaichi Chai',
        description: 'Tea brewed with green cardamom.',
        printedPrice: 490,
      },
      {
        name: 'Coffee',
        description: 'Freshly brewed coffee.',
        printedPrice: 690,
      },
    ],
  },
];

// Curated HTML highlights preserved for summary views
export const MENU_CATEGORIES: MenuCategory[] = [
  {
    name: 'Tandoor',
    summary: 'Charcoal-fired skewers, chops, and marinated cuts from the tandoor.',
    items: [
      'Masala Chanp',
      'Murgh Malai Tikka',
      'Macchli Gulnar',
      'Bewazni Paneer Tikka',
    ],
  },
  {
    name: 'Karahi',
    summary: 'Slow-cooked Lahori and Mughlai-inspired classics served from the karahi.',
    items: [
      'Bhuna Gosht',
      'Murgh Kali Mirch',
      'Mutton Shank Achari',
      'Nizami Murgh Kaju',
    ],
  },
  {
    name: 'Seafood',
    summary: 'Coastal and spiced seafood dishes prepared to order.',
    items: [
      'Tandoori Jhinga',
      'Jhinga Karahi',
      'Pakoras of The Sea',
    ],
  },
  {
    name: 'Desserts',
    summary: 'Traditional warm and chilled finishes to the evening.',
    items: [
      'Jalebi Garam',
      'Firni',
      'Shahi Tukra',
    ],
  },
  {
    name: 'Drinks',
    summary: 'Teas, coffees, and refreshing house coolers.',
    items: [
      'Kehwa',
      'Karak Chai',
      'Kashmiri Chai',
      'Coffee',
      'Lassi',
      'Nimbu Soda',
      'Jal Jeera',
    ],
  },
];
