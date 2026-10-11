import random

def generate_clue_dependencies(nodes, num_clues, start_node, treasure_node):
    """
    Assigns clues to nodes such that each clue unlocks another node,
    without creating circular dependencies or making the treasure unreachable.
    Uses backtracking.
    """
    available_nodes_for_clues = [n for n in nodes if n != treasure_node and n != start_node]
    available_nodes_to_lock = [n for n in nodes if n != start_node]
    
    # We want to place num_clues clues.
    # A state is a list of (clue_location, locked_node) tuples.
    # We want to find a state of length num_clues that is valid.
    
    dependencies = []
    states_explored = 0
    
    def is_valid_dependency(clue_loc, locked_node, current_deps):
        """
        A dependency is invalid if:
        1. clue_loc == locked_node (self lock)
        2. It creates a cycle (e.g. A unlocks B, B unlocks A).
        To check for cycles, we build a directed graph of locks.
        Edge from A to B means A must be visited before B.
        """
        if clue_loc == locked_node:
            return False
            
        graph = {}
        for c, l in current_deps:
            graph[l] = c # To unlock l, we need c
            
        # Add the new one
        graph[locked_node] = clue_loc
        
        # Check for cycles by tracing back from locked_node
        current = clue_loc
        while current in graph:
            current = graph[current]
            if current == locked_node:
                return False # Cycle detected
                
        return True

    def backtrack(deps):
        nonlocal states_explored
        states_explored += 1
        
        if len(deps) == num_clues:
            return deps
            
        used_clue_locs = {d[0] for d in deps}
        used_locks = {d[1] for d in deps}
        
        clue_candidates = [n for n in available_nodes_for_clues if n not in used_clue_locs]
        lock_candidates = [n for n in available_nodes_to_lock if n not in used_locks]
        random.shuffle(clue_candidates)
        random.shuffle(lock_candidates)
        
        for clue_loc in clue_candidates:
            for locked_node in lock_candidates:
                if is_valid_dependency(clue_loc, locked_node, deps):
                    deps.append((clue_loc, locked_node))
                    result = backtrack(deps)
                    if result:
                        return result
                    deps.pop()
                    
        return None

    result = backtrack([])
    if not result:
        # If impossible (e.g. too many clues for nodes), return empty or partial
        return [], states_explored
        
    return result, states_explored
