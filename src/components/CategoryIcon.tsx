import { 
  Briefcase, 
  TrendingUp, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Film, 
  Receipt, 
  Heart,
  Tag,
  DollarSign,
  Home,
  Smartphone,
  Coffee,
  ShoppingCart,
  Plane,
  Gamepad2,
  GraduationCap,
  Dumbbell,
  Gift,
  Wrench,
  LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  'briefcase': Briefcase,
  'trending-up': TrendingUp,
  'utensils': Utensils,
  'car': Car,
  'shopping-bag': ShoppingBag,
  'film': Film,
  'receipt': Receipt,
  'heart': Heart,
  'tag': Tag,
  'dollar-sign': DollarSign,
  'home': Home,
  'smartphone': Smartphone,
  'coffee': Coffee,
  'shopping-cart': ShoppingCart,
  'plane': Plane,
  'gamepad-2': Gamepad2,
  'graduation-cap': GraduationCap,
  'dumbbell': Dumbbell,
  'gift': Gift,
  'wrench': Wrench,
};

interface CategoryIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export const CategoryIcon = ({ iconName, className, size = 16 }: CategoryIconProps) => {
  const IconComponent = iconMap[iconName] || Tag;
  return <IconComponent className={className} size={size} />;
};
