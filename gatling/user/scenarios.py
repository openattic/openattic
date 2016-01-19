
from unittest import SkipTest

from requests.exceptions import HTTPError

from testcase import GatlingTestCase


class AuthTokenTestScenario(GatlingTestCase):
    username = "gatling_testuser"

    @classmethod
    def setUpClass(cls):
        super(AuthTokenTestScenario, cls).setUpClass()
        cls.require_config("options", "connect")
        cls.require_config("options", "auth_token")
        cls.require_enabled("user")

    @classmethod
    def setUp(cls):
        cls.testuser = cls._create_test_user()

    @classmethod
    def tearDown(cls):
        super(AuthTokenTestScenario, cls).tearDownClass()
        res = cls.send_request("GET", "users", search_param=("username=%s" % cls.username))
        if res["count"] > 0:
            for entry in res["response"]:
                cls.send_request("DELETE", "users", obj_id=entry["id"])

    @classmethod
    def _create_test_user(cls):
        user = {"username": cls.username,
                "password": "init",
                "email": "gatling_test@test.com",
                "first_name": "gatling_test",
                "last_name": "gatling_user",
                "is_active": True,
                "is_staff": True,
                "is_superuser": True}

        try:
            res = cls.send_request("POST", "users", data=user)
        except HTTPError as e:
            raise SkipTest(e.message)

        res = res["response"]
        res["password"] = "init"
        return res
