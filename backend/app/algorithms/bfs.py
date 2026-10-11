from collections import deque

def solve_bfs(graph, start_node, target_node):
    """
    Finds the minimum-edge path from start_node to target_node using BFS.
    graph is a dict mapping node_id to a list of adjacent node_ids.
    """
    if start_node not in graph or target_node not in graph:
        return {"path": [], "steps": 0, "visited_nodes": 0}

    queue = deque([[start_node]])
    visited = {start_node}
    visited_nodes_count = 1

    while queue:
        path = queue.popleft()
        current = path[-1]

        if current == target_node:
            return {
                "path": path,
                "steps": len(path) - 1,
                "visited_nodes": visited_nodes_count
            }

        for neighbor in graph.get(current, []):
            if neighbor not in visited:
                visited.add(neighbor)
                visited_nodes_count += 1
                new_path = list(path)
                new_path.append(neighbor)
                queue.append(new_path)

    return {"path": [], "steps": 0, "visited_nodes": visited_nodes_count}
