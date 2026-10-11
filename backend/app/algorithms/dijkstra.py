import heapq

def solve_dijkstra(nodes, edges, start_node, target_node):
    """
    Finds the optimal route considering distance + danger + energy.
    edges: list of dicts with 'from_node', 'to_node', 'distance', 'danger', 'energy_cost'
    """
    # Build adjacency list with combined weights
    graph = {node: [] for node in nodes}
    for edge in edges:
        u = edge['from_node']
        v = edge['to_node']
        # Cost = distance + danger + energy
        cost = edge['distance'] + edge['danger'] + edge['energy_cost']
        graph[u].append((v, cost))
        # Assuming undirected edges for the hunt map
        graph[v].append((u, cost))

    if start_node not in graph or target_node not in graph:
        return {"path": [], "cost": float('inf'), "visited_nodes": 0}

    # Priority queue stores (cost, current_node, path)
    pq = [(0, start_node, [start_node])]
    visited = set()
    visited_nodes_count = 0

    while pq:
        current_cost, current_node, path = heapq.heappop(pq)

        if current_node in visited:
            continue

        visited.add(current_node)
        visited_nodes_count += 1

        if current_node == target_node:
            # Trace the actual distance and time for the path
            total_distance = 0
            total_time = 0
            
            for i in range(len(path) - 1):
                u = path[i]
                v = path[i+1]
                # Find the specific edge in the raw edges list
                for e in edges:
                    if (e['from_node'] == u and e['to_node'] == v) or (e['from_node'] == v and e['to_node'] == u):
                        total_distance += e['distance']
                        total_time += e['time_cost']
                        break
                        
            return {
                "path": path,
                "cost": current_cost,
                "distance": total_distance,
                "time": total_time,
                "visited_nodes": visited_nodes_count
            }

        for neighbor, weight in graph.get(current_node, []):
            if neighbor not in visited:
                heapq.heappush(pq, (current_cost + weight, neighbor, path + [neighbor]))

    return {"path": [], "cost": float('inf'), "distance": 0, "time": 0, "visited_nodes": visited_nodes_count}

def find_all_paths(nodes, edges, start_node, target_node, max_paths=25):
    graph = {node: [] for node in nodes}
    for edge in edges:
        u = edge['from_node']
        v = edge['to_node']
        graph[u].append(v)
        graph[v].append(u)

    paths = []

    def dfs(current, end, path):
        if len(paths) >= max_paths:
            return
        path = path + [current]
        if current == end:
            paths.append(path)
            return
        if current not in graph:
            return
        for node in graph[current]:
            if node not in path:
                dfs(node, end, path)
                if len(paths) >= max_paths:
                    return

    dfs(start_node, target_node, [])
    return paths

