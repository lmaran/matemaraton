# Formatul mesajului de eroare

Alege ce campuri trebuie sa contina mesajul de eroare

## Alternativele luate in considerare

### 1. Format propriu, bazat pe ce folosesc Facebook, Google etc

- asta am folosit la precedentul proiect (CT)
Exemplu:

HTTP/1.1 400 Bad Request
Content-Type: application/json

```json
{
    "code": "validation-error",
    "message": "Eroare de validare",
    "errors": [
        {
            "field": "first_name",
            "code": "missing-field",
            "message": "Prenumele nu poate depăși 50 de caractere"
        }
    ]
}
```
