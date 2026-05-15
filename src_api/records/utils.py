# utils.py
from simpleeval import SimpleEval, NameNotDefined, FunctionNotDefined

def safe_eval_formula(formula, context):
    """
    Evaluate formula like "=D2*1.4" using values from context.
    Context should be dict: {'quantity': 10, 'cost_price': 5,...}
    Returns float or raises ValueError.
    """
    if not formula or not formula.startswith('='):
        return None

    expr = formula[1:] # strip '='

    s = SimpleEval()
    # Only allow these names
    s.names = {
        'quantity': context.get('quantity', 0),
        'cost_price': context.get('cost_price', 0),
        'selling_price': context.get('selling_price', 0),
        'reorder_level': context.get('reorder_level', 0),
    }
    # Disable all functions except basic math
    s.functions = {
        'round': round,
        'abs': abs,
        'min': min,
        'max': max,
        'sum': sum,
    }
    # Disable attributes, imports, etc
    s.operators = s.OPERATORS

    try:
        return round(float(s.eval(expr)), 2)
    except (NameNotDefined, FunctionNotDefined, ZeroDivisionError, TypeError, ValueError) as e:
        raise ValueError(f"Invalid formula '{formula}': {e}")