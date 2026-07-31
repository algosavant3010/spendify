-- Create expense_splits table for expense splitting feature
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  split_with JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, email, amount, paid}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  settled BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own expense splits" ON public.expense_splits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense splits" ON public.expense_splits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense splits" ON public.expense_splits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense splits" ON public.expense_splits
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_expense_splits_updated_at
  BEFORE UPDATE ON public.expense_splits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();