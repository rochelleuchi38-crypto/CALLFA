import joblib, os, sys
root = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'model')
files = ['crop_mapping.pkl','crop_profit_model.pkl']
for f in files:
    p = os.path.join(root,f)
    print('---',f,'exists=',os.path.exists(p))
    if os.path.exists(p):
        try:
            obj = joblib.load(p)
            print('loaded type:', type(obj))
            if isinstance(obj, dict):
                keys = list(obj.keys())[:20]
                print('dict keys sample:', keys)
                # if mapping is small, print full mapping
                if len(obj) <= 50:
                    print('full mapping:', obj)
            else:
                try:
                    import numpy as _np
                    # attempt to print shape or estimator info
                    if hasattr(obj, 'coef_'):
                        print('estimator: has coef_')
                    if hasattr(obj, 'classes_'):
                        print('estimator classes:', getattr(obj, 'classes_'))
                except Exception:
                    pass
            print('\n')
        except Exception as e:
            print('LOAD FAILED:', e)
