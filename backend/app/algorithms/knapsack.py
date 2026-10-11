def optimize_items_knapsack(items, max_capacity):
    """
    0/1 Knapsack algorithm.
    items: list of dicts with 'id', 'name', 'cost', 'usefulness'
    max_capacity: total resource (e.g., coins) allowed
    Returns the optimal list of items and total usefulness.
    """
    n = len(items)
    
    # dp[i][w] represents max usefulness using first i items and capacity w
    dp = [[0 for _ in range(max_capacity + 1)] for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        item = items[i-1]
        cost = item['cost']
        usefulness = item['usefulness']
        
        for w in range(1, max_capacity + 1):
            if cost <= w:
                dp[i][w] = max(dp[i-1][w], dp[i-1][w-cost] + usefulness)
            else:
                dp[i][w] = dp[i-1][w]
                
    # Backtrack to find the selected items
    selected_items = []
    w = max_capacity
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i-1][w]:
            selected_items.append(items[i-1])
            w -= items[i-1]['cost']
            
    return {
        "selected_items": selected_items,
        "total_usefulness": dp[n][max_capacity],
        "total_cost": max_capacity - w
    }
