#!/usr/bin/env python3
"""Deploy the reviewed client to the specifically labelled local Docker fixture."""

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request


PROJECT = os.environ["CODITY_DEPLOY_PROJECT"]
RESOURCE = os.environ["CODITY_DEPLOY_RESOURCE"]
PORT = os.environ["CODITY_DEPLOY_PORT"]
ENDPOINT = os.environ["DOCKER_HOST"]
if (
    not re.fullmatch(r"codity-deploy-test-[a-f0-9]{12,32}", PROJECT)
    or RESOURCE != "app"
    or PORT != "18080"
    or ENDPOINT != "unix:///var/run/docker.sock"
):
    raise RuntimeError("This recipe only supports the selected local rehearsal fixture")

NAME = f"{PROJECT}-{RESOURCE}"
REVISION_LABEL = "codity.fixture.revision"
ARTIFACT_LABEL = "codity.fixture.artifact"


def docker(*args):
    return subprocess.check_output(
        ["docker", "--host", ENDPOINT, *args], stderr=subprocess.DEVNULL
    )


def current():
    container = json.loads(docker("inspect", NAME))[0]
    labels = container["Config"]["Labels"]
    if (
        labels.get("codity.deployment.fixture") != PROJECT
        or labels.get("codity.deployment.resource") != RESOURCE
    ):
        raise RuntimeError("The selected container is not the labelled rehearsal fixture")
    return container


def check_port(container):
    bindings = container["NetworkSettings"]["Ports"].get("8080/tcp") or []
    if not container["State"]["Running"] or not any(
        binding["HostIp"] == "127.0.0.1" and binding["HostPort"] == PORT
        for binding in bindings
    ):
        raise RuntimeError("Fixture is not running on the expected loopback port")


def inspect():
    container = current()
    check_port(container)
    labels = container["Config"]["Labels"]
    revision, artifact = labels.get(REVISION_LABEL), labels.get(ARTIFACT_LABEL)
    if not revision or not artifact:
        raise RuntimeError("Fixture has no running revision or artifact identity")
    print(json.dumps({"revision": revision, "artifact_digest": artifact}))


def health():
    revision = os.environ["CODITY_DEPLOY_REVISION"]
    artifact = os.environ["CODITY_ARTIFACT_DIGEST"]
    container = current()
    check_port(container)
    labels = container["Config"]["Labels"]
    if labels.get(REVISION_LABEL) != revision or labels.get(ARTIFACT_LABEL) != artifact:
        raise RuntimeError("Running container has the wrong release identity")
    base = f"http://127.0.0.1:{PORT}"
    for attempt in range(30):
        try:
            with urllib.request.urlopen(base + "/health", timeout=2) as response:
                state = json.load(response)
            with urllib.request.urlopen(base + "/admin/portfolio-preview", timeout=2) as response:
                page = response.read()
            if (
                state == {"revision": revision, "artifact_digest": artifact}
                and b'<div id="root"></div>' in page
            ):
                return
        except (OSError, ValueError, urllib.error.URLError):
            pass
        time.sleep(0.2)
    raise RuntimeError("Client preview route or release health failed")


def deploy():
    old = current()
    check_port(old)
    revision = os.environ["CODITY_DEPLOY_REVISION"]
    artifact = os.environ["CODITY_ARTIFACT_DIGEST"]
    if not re.fullmatch(r"[a-f0-9]{40}", revision) or not re.fullmatch(
        r"[a-f0-9]{64}", artifact
    ):
        raise RuntimeError("Invalid reviewed release identity")
    # The existing fixture image ID is immutable, unlike a mutable image tag.
    base_image = old["Image"]
    docker("image", "inspect", base_image)
    image = f"{PROJECT}-{RESOURCE}:{revision}"
    docker(
        "build", "--file", ".codity/Dockerfile", "--build-arg",
        f"BASE_IMAGE={base_image}", "--tag", image, "client",
    )
    # Do not remove the known fixture until the reviewed client builds successfully.
    if current()["Id"] != old["Id"]:
        raise RuntimeError("Fixture changed during the image build")
    docker("rm", "-f", NAME)
    docker(
        "run", "-d", "--name", NAME,
        "--label", f"codity.deployment.fixture={PROJECT}",
        "--label", f"codity.deployment.resource={RESOURCE}",
        "--label", f"{REVISION_LABEL}={revision}",
        "--label", f"{ARTIFACT_LABEL}={artifact}",
        "--publish", f"127.0.0.1:{PORT}:8080",
        "--env", f"CODITY_DEPLOY_REVISION={revision}",
        "--env", f"CODITY_ARTIFACT_DIGEST={artifact}",
        "--entrypoint", "node", image, "server.mjs",
    )


if __name__ == "__main__":
    phase = sys.argv[1] if len(sys.argv) == 2 else ""
    if phase == "preflight":
        container = current()
        check_port(container)
        docker("image", "inspect", container["Image"])
    elif phase == "inspect":
        inspect()
    elif phase == "deploy":
        deploy()
    elif phase == "health":
        health()
    else:
        raise RuntimeError("Unknown rehearsal phase")
