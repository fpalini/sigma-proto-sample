import grpc
from concurrent import futures
import time

from data import nodes, edges
from relationship_pb2_grpc import RelationshipServiceServicer, add_RelationshipServiceServicer_to_server
from relationship_pb2 import RelationshipRequest, Relationship, Node


def find_node(key: str):
    return [n for n in nodes if n["key"] == key][0]

def build_node(node_data):
    return Node(
        key=node_data["key"],
        label=node_data["label"],
        url=node_data["URL"],
        cluster=node_data["cluster"],
        x=node_data["x"],
        y=node_data["y"],
        score=node_data["score"]
    )

# Importa i moduli generati

# Classe che implementa il servizio RelationshipService
class RelationshipServiceImpl(RelationshipServiceServicer):
    
    def GetRelationships(self, request: RelationshipRequest, context):
        print("request!!")
        print(request)
        """
        Implementazione del metodo GetRelationships.
        Questo è un metodo server-streaming, quindi restituisce un generatore (yield).
        """
        node_id = request.node_id
        print(f"Ricevuta richiesta GetRelationships per nodeId: {node_id}")

        node = find_node(node_id)
        node_proto = build_node(node)

        relationships_source = [
            Relationship(
                node_from=node_proto,
                node_to=build_node(find_node(e[1]))
            )
            for e in edges
            if e[0] == node_id
        ]

        relationships_dest = [
            Relationship(
                node_from=build_node(find_node(e[0])),
                node_to=node_proto
            )
            for e in edges
            if e[1] == node_id
        ]

        for rel in relationships_source + relationships_dest:
            print(f"Invio relazione")
            yield rel  # Usa 'yield' per inviare ogni messaggio singolarmente in streaming

        print(f"Streaming di relazioni completato per nodeId: {node_id}")

def serve():
    # Crea un server gRPC con un pool di thread
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    # Aggiungi l'implementazione del tuo servizio al server
    add_RelationshipServiceServicer_to_server(
        RelationshipServiceImpl(), server
    )

    # Associa il server a un indirizzo e porta
    port = 9090
    server.add_insecure_port(f'[::]:{port}') # [::] ascolta su tutte le interfacce IPv6 e IPv4
    print(f"Server gRPC in ascolto sulla porta {port}")
    server.start() # Avvia il server

    try:
        while True:
            time.sleep(86400) # Mantieni il server in esecuzione per un giorno
    except KeyboardInterrupt:
        server.stop(0) # Ferma il server in caso di interruzione da tastiera

if __name__ == '__main__':
    serve()
