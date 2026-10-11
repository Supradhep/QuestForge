def explore_dfs(graph, start_node, target_node=None):
    """
    Explores the graph using DFS.
    Can be used to check connectivity or find a simple path.
    graph is a dict mapping node_id to a list of adjacent node_ids.
    """
    if start_node not in graph:
        return {"reachable_nodes": [], "path_to_target": None, "visited_nodes": 0}

    visited = set()
    reachable = []
    path_to_target = None
    stack = [(start_node, [start_node])]
    visited_nodes_count = 0

    while stack:
        current, path = stack.pop()
        
        if current not in visited:
            visited.add(current)
            reachable.append(current)
            visited_nodes_count += 1
            
            if target_node and current == target_node and path_to_target is None:
                path_to_target = path
                
            for neighbor in reversed(graph.get(current, [])):
                if neighbor not in visited:
                    stack.append((neighbor, path + [neighbor]))
                    
    return {
        "reachable_nodes": reachable,
        "path_to_target": path_to_target,
        "visited_nodes": visited_nodes_count,
        "is_connected": len(visited) == len(graph)
    }
