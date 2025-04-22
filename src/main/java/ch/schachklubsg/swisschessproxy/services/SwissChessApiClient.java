package ch.schachklubsg.swisschessproxy.services;

import ch.schachklubsg.swisschessproxy.Player;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SwissChessApiClient {

    private final WebClient webClient;

    public SwissChessApiClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://www.swisschess.ch/").build();
    }

    public Mono<Player> getPlayerInfo(String playerId) {
        String url = getUrlForPlayerId(playerId);

        System.out.println("Fetching info for player with ID: " + playerId + " from URL: " + url);

        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .handle((html, sink) -> {
                    // Regex for the h2: ID and Name
                    Pattern h2Pattern = Pattern.compile("<h2>(\\d+):\\s*(.*)</h2>");
                    Matcher h2Matcher = h2Pattern.matcher(html);

                    // Regex for the Elo
                    Pattern h3Pattern = Pattern.compile("<h3>Elo: (\\d+)</h3>");
                    Matcher h3Matcher = h3Pattern.matcher(html);

                    if (h2Matcher.find() && h3Matcher.find()) {
                        String id = h2Matcher.group(1).trim();
                        String name = h2Matcher.group(2).trim();
                        long elo = Long.parseLong(h3Matcher.group(1));

                        sink.next(new Player(id, elo, name));
                    } else {
                        sink.error(new RuntimeException("Player data not found in HTML in URL: \"" + url + "\""));
                    }
                });
    }

    private String getUrlForPlayerId(String playerId) {
        String unEncodedParamValue = "/schachsport/fl/detail.php?code=" + playerId;

        String encodedParamValue = Base64.getEncoder().encodeToString(unEncodedParamValue.getBytes());

        return "/fuehrungsliste-detail.html?old=" + encodedParamValue;
    }
}
