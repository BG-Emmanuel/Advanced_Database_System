package com.buy237.service.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {
    private final String SECRET_KEY = "replace_with_a_very_secret_key";
    private final long EXPIRATION = 1000 * 60 * 60 * 24; // 24h

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token).getBody();
        return claimsResolver.apply(claims);
    }
}
