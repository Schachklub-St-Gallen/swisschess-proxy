package ch.schachklubsg.swisschessproxy.services;

import ch.schachklubsg.swisschessproxy.Player;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class SwissChessApiClientTest {

    private SwissChessApiClient swissChessApiClient;
    private WebClient mockWebClient;
    private WebClient.RequestHeadersUriSpec mockRequest;
    private WebClient.ResponseSpec mockResponseSpec;

    @BeforeEach
    void setup() {
        mockWebClient = mock(WebClient.class);
        mockRequest = mock(WebClient.RequestHeadersUriSpec.class);
        mockResponseSpec = mock(WebClient.ResponseSpec.class);

        WebClient.Builder builder = mock(WebClient.Builder.class);
        when(builder.baseUrl(anyString())).thenReturn(builder);
        when(builder.build()).thenReturn(mockWebClient);

        swissChessApiClient = new SwissChessApiClient(builder);
    }

    @Test
    void testGetPlayerInfo_successfulParse() {
        String playerId = "12345";
        String htmlResponse = """
                <html>
                <body>
                    <h2>12345: Magnus Carlsen</h2>
                    <h3>Elo: 2865</h3>
                </body>
                </html>
                """;

        when(mockWebClient.get()).thenReturn(mockRequest);
        when(mockRequest.uri(anyString())).thenReturn(mockRequest);
        when(mockRequest.retrieve()).thenReturn(mockResponseSpec);
        when(mockResponseSpec.bodyToMono(String.class)).thenReturn(Mono.just(htmlResponse));

        Mono<Player> result = swissChessApiClient.getPlayerInfo(playerId);

        StepVerifier.create(result)
                .expectNextMatches(player -> player.id().equals("12345")
                        && player.name().equals("Magnus Carlsen")
                        && player.elo() == 2865)
                .verifyComplete();
    }

    @Test
    void testGetPlayerInfo_missingData() {
        String playerId = "99999";
        String badHtml = "<html><body><h1>Not Found</h1></body></html>";

        when(mockWebClient.get()).thenReturn(mockRequest);
        when(mockRequest.uri(anyString())).thenReturn(mockRequest);
        when(mockRequest.retrieve()).thenReturn(mockResponseSpec);
        when(mockResponseSpec.bodyToMono(String.class)).thenReturn(Mono.just(badHtml));

        Mono<Player> result = swissChessApiClient.getPlayerInfo(playerId);

        StepVerifier.create(result)
                .expectErrorMatches(throwable -> throwable instanceof RuntimeException &&
                        throwable.getMessage().contains("Player data not found"))
                .verify();
    }
}