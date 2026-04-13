def get_max_routes(subscription_type):
    limits = {
        'free': 5,
        'premium': 10,
        'max': 15,
    }
    return limits.get(subscription_type, 5)

def get_max_points_per_route(subscription_type):
    limits = {
        'free': 20,
        'premium': 30,
        'max': 40,
    }
    return limits.get(subscription_type, 20)