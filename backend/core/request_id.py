import uuid

from django.utils.deprecation import MiddlewareMixin


class RequestIDMiddleware(MiddlewareMixin):
    """
    Генерирует X-Request-ID, если его нет, и добавляет в request/response.
    Помогает коррелировать логи и ответы.
    """

    header_name = "HTTP_X_REQUEST_ID"
    response_header = "X-Request-ID"

    def process_request(self, request):
        request.request_id = request.META.get(self.header_name) or uuid.uuid4().hex
        request.META[self.header_name] = request.request_id

    def process_response(self, request, response):
        if hasattr(request, "request_id"):
            response[self.response_header] = request.request_id
        return response
