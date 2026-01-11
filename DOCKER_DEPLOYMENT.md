# Deployment Docker - asamblea.cloud

## Resumen
Sistema de Gestión de Asambleas dockerizado para `asamblea.cloud`.

## Puertos Utilizados
| Servicio | Puerto | Acceso |
|----------|--------|--------|
| Frontend | 6002 | http://localhost:6002 |
| Backend  | 8082 | http://localhost:8082 |
| MySQL    | interno | Solo dentro de Docker |

## Comandos

### Iniciar todo
```bash
docker-compose up -d --build
```

### Ver logs
```bash
docker-compose logs -f
```

### Detener
```bash
docker-compose down
```

### Reiniciar un servicio
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Ver estado
```bash
docker-compose ps
```

### Eliminar todo (incluyendo datos)
```bash
docker-compose down -v
```

## Credenciales por Defecto

### Base de Datos MySQL
- **Host**: db (interno)
- **Database**: asamblea_db
- **Usuario**: asamblea_user  
- **Password**: asamblea_pass_2024

### Usuario Admin Inicial
- **Usuario**: admin
- **Contraseña**: admin

## Configurar en Nginx (proxy inverso)

Para acceder mediante `asamblea.cloud`:

```nginx
server {
    listen 80;
    server_name asamblea.coopreducto.coop.py;

    location / {
        proxy_pass http://localhost:6002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
