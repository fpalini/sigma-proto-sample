import grpc
from concurrent import futures
import time
import random

# Importa i moduli generati
import relationship_pb2
import relationship_pb2_grpc

# Classe che implementa il servizio RelationshipService
class RelationshipServiceServicer(relationship_pb2_grpc.RelationshipServiceServicer):

    def GetRelationships(self, request: relationship_pb2.RelationshipRequest, context):
        print("request!!")
        print(request)
        """
        Implementazione del metodo GetRelationships.
        Questo è un metodo server-streaming, quindi restituisce un generatore (yield).
        """
        node_id = request.node_id
        print(f"Ricevuta richiesta GetRelationships per nodeId: {node_id}")

        # Simula il recupero di dati da un database o da un'altra sorgente
        # e li restituisce in streaming.
        relationships = [
            relationship_pb2.Relationship(
                label=f"rel{random.randint(0, 10000)}",
                node_from=node_id if i % 2 == 0 else f"node_{random.randint(0, 10000)}",
                node_to=node_id if i % 2 != 0 else f"node_{random.randint(0, 10000)}",
                props={"weight": "0.8", "timestamp": str(time.time())}
            )
            for i in range(request.n_edges)
        ]

        for rel in relationships:
            print(f"Invio relazione: {rel.label} da {rel.node_from} a {rel.node_to}")
            yield rel # Usa 'yield' per inviare ogni messaggio singolarmente in streaming
            time.sleep(0.5) # Simula un ritardo di rete/elaborazione

        print(f"Streaming di relazioni completato per nodeId: {node_id}")

def serve():
    # Crea un server gRPC con un pool di thread
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    # Aggiungi l'implementazione del tuo servizio al server
    relationship_pb2_grpc.add_RelationshipServiceServicer_to_server(
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
