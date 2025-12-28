package com.asamblea.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import com.asamblea.model.Usuario;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> extraClaims = new HashMap<>();
        // Include tokenVersion in JWT for session invalidation
        if (userDetails instanceof Usuario) {
            Usuario usuario = (Usuario) userDetails;
            extraClaims.put("tokenVersion", usuario.getTokenVersion() != null ? usuario.getTokenVersion() : 0);
        }
        return generateToken(extraClaims, userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        boolean basicValid = (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
        
        // Check tokenVersion for session invalidation
        if (basicValid && userDetails instanceof Usuario) {
            Usuario usuario = (Usuario) userDetails;
            Integer tokenVersionInJwt = extractTokenVersion(token);
            Integer currentTokenVersion = usuario.getTokenVersion() != null ? usuario.getTokenVersion() : 0;
            return tokenVersionInJwt != null && tokenVersionInJwt.equals(currentTokenVersion);
        }
        
        return basicValid;
    }

    public Integer extractTokenVersion(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Object version = claims.get("tokenVersion");
            if (version instanceof Integer) {
                return (Integer) version;
            } else if (version instanceof Number) {
                return ((Number) version).intValue();
            }
            return 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
