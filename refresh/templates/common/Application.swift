import Foundation
import Kitura
import LoggerAPI
import Health
import Configuration
<% if (appType === 'crud') { -%>
import <%- generatedModule %>
<% } -%>
import CloudEnvironment
<% if (Object.keys(capabilities).length > 0) { -%>
<%   Object.keys(capabilities).forEach(function(capabilityType) { -%>
<%     if(capabilities[capabilityType] === true || typeof(capabilities[capabilityType]) === 'string') { -%>
<%-      include(`../capabilities/${capabilityType}/importModule.swift`) -%>
<%     } -%>
<%   }); -%>
<% } -%>
<% if (Object.keys(services).length > 0) { -%>
<%   Object.keys(services).forEach(function(serviceType) { -%>
<%-    include(`../services/${serviceType}/importModule.swift`) -%>
<%   }); -%>
<% } %>
public let router = Router()
public let cloudEnv = CloudEnv()
<% if (basepath) { -%>
public var basePath = "<%- basepath %>"
<% } -%>

<% if (Object.keys(services).length > 0) { -%>
<%   Object.keys(services).forEach(function(serviceType) { -%>
<%-    include(`../services/${serviceType}/declareService.swift`) -%>
<%   }); %>
<% } -%>
public func initialize() throws {

    /*manager.load(file: "config.json", relativeFrom: .project)   Currently need to revise this*/

<% if (Object.keys(capabilities).length > 0) { -%>
<%   Object.keys(capabilities).forEach(function(capabilityType) { -%>
<%     if (capabilities[capabilityType]) { -%>
<%-      include(`../capabilities/${capabilityType}/declareCapability.swift`) %>
<%     } -%>
<%   }); -%>
<% } -%>
<% if (Object.keys(services).length > 0) { -%>
<%   Object.keys(services).forEach(function(serviceType) { -%>
<%     services[serviceType].forEach(function(service) { -%>
<%       if (bluemix) { -%>
<%-        include(`../services/${serviceType}/initializeBluemixService.swift`, { service: service }) %>
<%       } else { -%>
<%-        include(`../services/${serviceType}/initializeService.swift`, { service: service}) %>
<%       } -%>
<%     }); -%>
<%   }); -%>
<% } -%>
    router.all("/*", middleware: BodyParser())
<% if (web) { -%>
    router.all("/", middleware: StaticFileServer())
<% } -%>
<% if (appType === 'crud') { %>
    try initializeCRUDResources(manager: manager, router: router)
<% } -%>

<% if (resources) { -%>
<%   resources.forEach(function(resource) { -%>
    initialize<%- resource %>Routes()
<%   }); -%>
<% } -%>

<% if (hostSwagger) { -%>
    initializeSwaggerRoute(path: ConfigurationManager.BasePath.project.path + "/definitions/<%- appName %>.yaml")
<% } -%>
    let health = Health()

    router.get("/health") { request, response, _ in
        let result = health.status.toSimpleDictionary()
        if health.status.state == .UP {
            try response.send(json: result).end()
        } else {
            try response.status(.serviceUnavailable).send(json: result).end()
        }
    }
}

public func run() throws {
    Kitura.addHTTPServer(onPort: cloudEnv.port, with: router)
    Kitura.run()
}
