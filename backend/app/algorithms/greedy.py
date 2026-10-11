def recommend_clue_greedy(available_clues):
    """
    Recommends the best clue based on value/time ratio using a Greedy approach.
    available_clues: list of dicts with 'id', 'information_value', 'time_required', 'difficulty'
    """
    if not available_clues:
        return None
        
    # Calculate value-to-time ratio for each clue
    # Add a small epsilon to time to avoid division by zero just in case
    for clue in available_clues:
        time = max(1, clue['time_required'])
        clue['ratio'] = clue['information_value'] / time
        
    # Greedy choice: pick the one with the highest ratio
    best_clue = max(available_clues, key=lambda x: x['ratio'])
    
    return best_clue
