
import requests

from testcase import GatlingTestCase


class TokenAuthTestScenario(GatlingTestCase):

    @classmethod
    def setUpClass(cls):
        super(TokenAuthTestScenario, cls).setUpClass()
        cls.require_config("users", "admin")
        cls.require_config("users", "password")
        cls.require_config("options", "api_token_auth")
        cls.require_config("options", "auth_token")
        cls.require_enabled("auth")
        cls.auth_token = cls.conf.get("options", "auth_token")

    @classmethod
    def send_api_token_auth_request(cls, *args, **kwargs):
        request_url = cls.conf.get("options", "api_token_auth")
        username = kwargs.get("username", cls.conf.get("users", "admin"))
        password = kwargs.get("password", cls.conf.get("users", "password"))

        res = requests.post(request_url, data={"username": username, "password": password})
        res.raise_for_status()
        return res.json()