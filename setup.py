from setuptools import setup, find_packages

setup(
    name="openpeerpower-frontend",
    version="20210523.1",
    description="The Open Peer Power frontend",
    url="https://github.com/openpeerpower/openpeerpower-polymer",
    author="The Open Peer Power Authors",
    author_email="hello@openpeerpower.io",
    license="Apache-2.0",
    packages=find_packages(include=["opp_frontend", "opp_frontend.*"]),
    include_package_data=True,
    zip_safe=False,
)
