-- Fix search_path security warnings by updating functions

-- Update the update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the create_default_categories function with secure search_path
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon, type) VALUES
    (NEW.id, 'Salary', '#10b981', 'briefcase', 'income'),
    (NEW.id, 'Investment', '#3b82f6', 'trending-up', 'income'),
    (NEW.id, 'Food & Dining', '#ef4444', 'utensils', 'expense'),
    (NEW.id, 'Transportation', '#f59e0b', 'car', 'expense'),
    (NEW.id, 'Shopping', '#ec4899', 'shopping-bag', 'expense'),
    (NEW.id, 'Entertainment', '#8b5cf6', 'film', 'expense'),
    (NEW.id, 'Bills & Utilities', '#06b6d4', 'receipt', 'expense'),
    (NEW.id, 'Healthcare', '#14b8a6', 'heart', 'expense');
  RETURN NEW;
END;
$$;