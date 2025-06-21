import grpc
from concurrent import futures
import time

from data import nodes, edges
from relationship_pb2_grpc import RelationshipServiceServicer, add_RelationshipServiceServicer_to_server
from relationship_pb2 import RelationshipRequest, Relationship, Node


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

        node = [n for n in nodes if n["key"] == node_id][0]

        node_proto = Node(
                    key=node["key"],
                    label=node["label"],
                    url=node["URL"],
                    cluster=node["cluster"],
                    x=node["x"],
                    y=node["y"],
                    score=node["score"]
                )

        # Simula il recupero di dati da un database o da un'altra sorgente
        # e li restituisce in streaming.
        relationships_source = [
            Relationship(
                node_from=node_proto,
                node_to=Node(
                    key=nodes[e[0]]["key"],
                    label=nodes[e[0]]["label"],
                    url=nodes[e[0]]["URL"],
                    cluster=nodes[e[0]]["cluster"],
                    x=nodes[e[0]]["x"],
                    y=nodes[e[0]]["y"],
                    score=nodes[e[0]]["score"]
                )
            )
            for e in edges
            if e[0] == node_id
        ]

        relationships_dest = [
            Relationship(
                node_from=Node(
                    key=nodes[e[0]]["key"],
                    label=nodes[e[0]]["label"],
                    url=nodes[e[0]]["URL"],
                    cluster=nodes[e[0]]["cluster"],
                    x=nodes[e[0]]["x"],
                    y=nodes[e[0]]["y"],
                    score=nodes[e[0]]["score"]
                ),
                node_to=node_proto
            )
            for e in edges
            if e[1] == node_id
        ]

        for rel in relationships_source + relationships_dest:
            print(f"Invio relazione: {rel.label} da {rel.node_from} a {rel.node_to}")
            yield rel # Usa 'yield' per inviare ogni messaggio singolarmente in streaming
            time.sleep(0.5) # Simula un ritardo di rete/elaborazione

        print(f"Streaming di relazioni completato per nodeId: {node_id}")

def serve():
    # Crea un server gRPC con un pool di thread
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    # Aggiungi l'implementazione del tuo servizio al server
    add_RelationshipServiceServicer_to_server(
        RelationshipServiceServicer(), server
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
