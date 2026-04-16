from django.http import HttpResponse


def robots_txt(request):
    scheme = 'https' if request.is_secure() else 'http'
    host = request.get_host()
    content = (
        "User-agent: *\n"
        "Disallow: /admin/\n"
        "Disallow: /api/\n"
        "Allow: /\n"
        f"Sitemap: {scheme}://{host}/sitemap.xml\n"
    )
    return HttpResponse(content, content_type='text/plain')
