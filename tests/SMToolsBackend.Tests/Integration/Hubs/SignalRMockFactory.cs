using Microsoft.AspNetCore.SignalR;
using NSubstitute;

namespace SMToolsBackend.Tests.Integration.Hubs;

public static class SignalRMockFactory
{
    public static IHubCallerClients CreateClients()
    {
        var clients = Substitute.For<IHubCallerClients>();
        var clientProxy = Substitute.For<IClientProxy>();
        var singleClientProxy = Substitute.For<ISingleClientProxy>();
        clients.Group(Arg.Any<string>()).Returns(clientProxy);
        clients.OthersInGroup(Arg.Any<string>()).Returns(clientProxy);
        clients.Caller.Returns(singleClientProxy);
        clients.Client(Arg.Any<string>()).Returns(singleClientProxy);
        clientProxy.SendCoreAsync(Arg.Any<string>(), Arg.Any<object?[]>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        singleClientProxy.SendCoreAsync(Arg.Any<string>(), Arg.Any<object?[]>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        return clients;
    }

    public static IGroupManager CreateGroupManager()
    {
        var groups = Substitute.For<IGroupManager>();
        groups.AddToGroupAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        groups.RemoveFromGroupAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        return groups;
    }
}
