// Importing each resource triggers its registry.registerPath() side-effects.
// If you add a new resource, import it here too — otherwise it won't appear
// in the OpenAPI spec.
import "./bookings";
import "./customers";
import "./sailings";
import "./terminals";
import "./vessels";
