# PR dependency attribution acceptance fixture

DO NOT MERGE. This is intentionally vulnerable test data, isolated from application code and build manifests. Do not install or execute it.

Expected: introduced direct vulnerabilities in axios 0.21.1 and lodash 4.17.20, plus transitive vulnerabilities in follow-redirects 1.14.7 through axios. The reviewed comparison must retain exact base/head/workflow evidence. Existing repository dependency debt must remain absent from PR findings. No license phase or repository-wide audit may run.

This lockfile is a scanner fixture only. Public npm metadata supplies package identities and integrity; OSV supplies actual advisory evidence. Close the test PR after acceptance. No merge or deployment is intended.
