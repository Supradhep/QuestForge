import random

class DisjointSet:
    def __init__(self, vertices):
        self.parent = {v: v for v in vertices}
        self.rank = {v: 0 for v in vertices}

    def find(self, item):
        if self.parent[item] == item:
            return item
        self.parent[item] = self.find(self.parent[item])
        return self.parent[item]

    def union(self, set1, set2):
        root1 = self.find(set1)
        root2 = self.find(set2)

        if root1 != root2:
            if self.rank[root1] > self.rank[root2]:
                self.parent[root2] = root1
            elif self.rank[root1] < self.rank[root2]:
                self.parent[root1] = root2
            else:
                self.parent[root2] = root1
                self.rank[root1] += 1
            return True
        return False

def generate_base_map_kruskal(nodes, edges_pool):
    """
    Generates a Minimum Spanning Tree (MST) using Kruskal's Algorithm.
    nodes: list of node_ids
    edges_pool: list of dicts {'from_node': u, 'to_node': v, 'cost': w, 'distance': d, 'danger': dn, 'energy': e, 'time': t}
    Returns list of selected edges that form the MST.
    """
    # Sort edges based on cost
    edges_pool.sort(key=lambda edge: edge['cost'])
    
    ds = DisjointSet(nodes)
    mst_edges = []
    
    for edge in edges_pool:
        u = edge['from_node']
        v = edge['to_node']
        
        if ds.union(u, v):
            mst_edges.append(edge)
            
    return mst_edges

def generate_map(nodes, difficulty="Medium"):
    """
    Generates a playable map using Kruskal's MST over a difficulty-layered topology
    so that the shortest path from Start to Treasure scales strictly with difficulty.
    """
    n = len(nodes)
    if difficulty == "Easy":
        target_depth = max(3, min(n - 1, round(n * 0.45)))
        dist_range = (1, 6)
        danger_range = (0, 2)
        energy_range = (2, 5)
        time_range = (3, 7)
        extra_edges_count = max(1, n // 3)
    elif difficulty == "Hard":
        target_depth = max(6, min(n - 1, round(n * 0.82)))
        dist_range = (5, 14)
        danger_range = (3, 5)
        energy_range = (8, 15)
        time_range = (10, 20)
        extra_edges_count = max(3, (n * 2) // 3)
    else:  # Medium
        target_depth = max(5, min(n - 1, round(n * 0.65)))
        dist_range = (3, 10)
        danger_range = (1, 4)
        energy_range = (4, 9)
        time_range = (5, 12)
        extra_edges_count = max(2, n // 2)

    if n <= 3:
        target_depth = max(1, n - 1)

    # Assign each node to a depth layer [0 .. target_depth]
    # Start (nodes[0]) is layer 0; Treasure (nodes[-1]) is layer target_depth.
    # Because valid edges only connect nodes with |layer[u] - layer[v]| <= 1,
    # the shortest path from Start to Treasure is guaranteed to be >= target_depth steps.
    layers = {}
    layers[nodes[0]] = 0
    layers[nodes[-1]] = target_depth

    middle_nodes = list(nodes[1:-1])
    random.shuffle(middle_nodes)

    # Ensure every intermediate layer 1 .. target_depth - 1 has at least one spine node
    for idx, node_id in enumerate(middle_nodes):
        if idx < target_depth - 1:
            layers[node_id] = idx + 1
        else:
            layers[node_id] = random.randint(1, max(1, target_depth - 1))

    edges_pool = []
    for i in range(n):
        for j in range(i + 1, n):
            u, v = nodes[i], nodes[j]
            layer_diff = abs(layers[u] - layers[v])

            # Only allow edges between same layer or adjacent layers (|layer_diff| <= 1)
            # and never connect Start directly to Treasure
            is_invalid_jump = (layer_diff > 1) or (i == 0 and j == n - 1 and n > 2)
            if is_invalid_jump:
                continue

            distance = random.randint(*dist_range)
            danger = random.randint(*danger_range)
            energy = random.randint(*energy_range)
            time = random.randint(*time_range)
            cost = distance + danger + energy

            edges_pool.append({
                'from_node': u,
                'to_node': v,
                'distance': distance,
                'danger': danger,
                'energy_cost': energy,
                'time_cost': time,
                'cost': cost,
            })

    # Get MST via Kruskal's
    mst = generate_base_map_kruskal(nodes, edges_pool)
    mst_set = set(f"{e['from_node']}-{e['to_node']}" for e in mst)

    extra_edges = []
    random.shuffle(edges_pool)
    for edge in edges_pool:
        if len(extra_edges) >= extra_edges_count:
            break
        edge_key1 = f"{edge['from_node']}-{edge['to_node']}"
        edge_key2 = f"{edge['to_node']}-{edge['from_node']}"
        if edge_key1 not in mst_set and edge_key2 not in mst_set:
            extra_edges.append(edge)
            mst_set.add(edge_key1)

    return mst + extra_edges


