package com.asamblea.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        System.out.println(">>> JWT shouldNotFilter checking path: " + path);
        // No filtrar rutas públicas
        boolean skip = path.equals("/api/auth/login") ||
                path.equals("/api/auth/system-reset") ||
                path.equals("/api/socios/reset-padron") ||
                path.equals("/api/configuracion") ||
                path.startsWith("/public") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-ui");
        System.out.println(">>> JWT shouldNotFilter result: " + skip);
        return skip;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        System.out.println("DEBUG: Request URI: " + request.getRequestURI());
        System.out.println("DEBUG: Auth Header: " + (authHeader != null ? "Present" : "Missing"));

        final String jwt;
        final String username;
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("DEBUG: No Bearer token found, skipping JWT filter");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            jwt = authHeader.substring(7).trim();
            username = jwtService.extractUsername(jwt);
            System.out.println("DEBUG: Username from JWT: " + username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                System.out.println(
                        "DEBUG: UserDetails loaded for: " + username + " with roles: " + userDetails.getAuthorities());
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Log authentication error but don't fail the request (let SecurityFilterChain
            // handle 403)
            // This allows us to see WHY it failed in the logs
            System.err.println("JWT Authentication Error: " + e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }
}
