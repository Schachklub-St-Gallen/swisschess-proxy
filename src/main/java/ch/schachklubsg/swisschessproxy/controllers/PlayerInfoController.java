package ch.schachklubsg.swisschessproxy.controllers;

import ch.schachklubsg.swisschessproxy.Player;
import ch.schachklubsg.swisschessproxy.services.SwissChessApiClient;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
public class PlayerInfoController {
    private final SwissChessApiClient swissChessApiClient;

    public PlayerInfoController(SwissChessApiClient swissChessApiClient) {
        this.swissChessApiClient = swissChessApiClient;
    }

    @CrossOrigin(origins = "https://adapter.swisschess.ch")
    @GetMapping("/player")
    public Mono<Player> greeting(@RequestParam(value = "id") String id) {
        return swissChessApiClient.getPlayerInfo(id);
    }

    @CrossOrigin(origins = "https://adapter.swisschess.ch")
    @GetMapping("/players")
    public Flux<Player> getMultiplePlayers(@RequestParam List<String> ids) {
        return Flux.fromIterable(ids)
                .flatMap(id -> swissChessApiClient.getPlayerInfo(id)
                        .onErrorResume(e -> Mono.just(new Player(id, 0, "Unknown"))));
    }
}
