import type { Observable } from "rxjs";
import { Relationship, RelationshipRequest, RelationshipServiceClientImpl } from "../generated/relationship";
import { GrpcWebImpl } from '../generated/relationship';

// !!! IMPORTANTE !!!
// Questo è l'URL del tuo proxy gRPC-Web (Envoy, grpcwebproxy, ecc.), NON l'URL del server gRPC Python diretto.
const GRPC_WEB_PROXY_URL = "http://localhost:8080"; // Assicurati che corrisponda alla porta del tuo proxy

export function runGrpcClient(nodeId: string): Observable<Relationship> {
    console.log("Avvio del client gRPC-Web...");

    // Inizializza l'implementazione RPC per gRPC-Web
    const rpc = new GrpcWebImpl(GRPC_WEB_PROXY_URL, {
        debug: true, // Utile per vedere i dettagli delle chiamate nel browser console
    });

    // Crea un'istanza del client del tuo servizio RelationshipService
    const client = new RelationshipServiceClientImpl(rpc);

    const request: RelationshipRequest = { nodeId: nodeId, nEdges: 5 };

    appendLog(`Inviando richiesta per nodeId: ${request.nodeId}`);

    // Chiamata al metodo server-streaming GetRelationships
    // Il metodo restituisce un Observable (grazie a ts-proto e rxjs)
    return client.GetRelationships(request);
}

// Helper per aggiornare la UI con i log
function appendLog(message: string) {
    const logDiv = document.getElementById('log');
    if (logDiv) {
        const p = document.createElement('p');
        p.textContent = message;
        logDiv.appendChild(p);
        logDiv.scrollTop = logDiv.scrollHeight; // Scrolla in basso
    }
}

// Esegui il client quando il DOM è pronto
document.addEventListener('DOMContentLoaded', runGrpcClient);