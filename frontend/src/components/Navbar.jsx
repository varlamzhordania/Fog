"use client"

import {Avatar, Button, Drawer, Dropdown, Label, Separator, Typography} from "@heroui/react";
import Link from "next/link";
import {
    ClipboardList,
    LayoutDashboard, LogOut, MapPinHouse, Menu, Moon, Search, ShoppingCart, Sun, UserRound
} from "lucide-react";
import {useState} from "react";
import Icon from "@/components/icon/Icon";
import {useThemeStore} from "@/stores/theme";
import {useConfig} from "@/queries/config";
import Image from "@/components/Image";
import {useAuthStore} from "@/stores/auth";
import {useRouter} from "next/navigation";
import {useLogout} from "@/queries/auth";
import {useCartStore} from "@/stores/cart";


const Navbar = () => {
    const {theme, toggleTheme} = useThemeStore(state => state)
    const {user, logged_in} = useAuthStore(state => state)
    const cartItems = useCartStore((state) => state.items);
    const {data: config} = useConfig()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const router = useRouter()
    const logout = useLogout()
    const logo = theme === 'dark' ? config.WEBSITE_SECONDARY_ICON : config.WEBSITE_PRIMARY_ICON
    const totalQuantity = cartItems.reduce((total, item) => total + Number(item.quantity), 0);


    const navigation = [{
        title: "Home", href: "/",
    }, {
        title: "Shop", href: "/products",
    }, {
        title: "Research", href: "/research",
    }, {
        title: "About", href: "/about",
    },]

    const handleLogout = () => {
        logout.mutate()
    }

    return <header className={"container sticky top-0 bg-background z-100"}>
        <div className={"w-full py-4 flex justify-between items-center border-b-2"}>
            <div className={"xl:w-1/3 flex flex-row justify-start items-center gap-2"}>
                <Button isIconOnly variant={"ghost"}
                        className={"lg:hidden"}
                        onPress={() => setSidebarOpen(prevState => !prevState)}>
                    <Icon icon={Menu}/>
                </Button>


                <Link href="/" replace={true}
                      className={"flex flex-row gap-2 justify-start items-center"}>
                    {logo && <Image src={logo} width={64} height={64} alt={"FOG LOGO"}
                                    className={"object-cover"}/>}

                    <Typography type={"span"}
                                className={"hidden sm:block font-atomic text-2xl font-bold uppercase"}>
                        fog direct
                    </Typography>
                </Link>
            </div>
            <nav className={"xl:w-1/3 hidden lg:flex flex-row gap-6 justify-center items-center"}>
                {navigation.map((i, x) => (<Link key={x} href={i.href} className={"nav-link"}>
                    {i.title}
                </Link>))}
            </nav>
            <div className={"xl:w-1/3 flex flex-row justify-end items-center lg:gap-2"}>
                {/*<Button isIconOnly variant={"ghost"}>*/}
                {/*    <Icon icon={Search}/>*/}
                {/*</Button>*/}

                {logged_in && user ? <Dropdown isOpen={dropdownOpen} onOpenChange={setDropdownOpen}>
                        <Button isIconOnly variant={"ghost"}>
                            <Icon icon={UserRound}/>
                        </Button>
                        <Dropdown.Popover>
                            <div className="px-3 pt-3 pb-1">
                                <div className="flex items-center gap-2">
                                    <Avatar size="sm">
                                        <Avatar.Image
                                            alt={`${user.first_name} ${user.last_name}`}
                                        />
                                        <Avatar.Fallback delayMs={600}
                                                         className={"uppercase"}>{user.first_name[0]}{user.last_name[0]}</Avatar.Fallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-0">
                                        <p className="text-sm leading-5 font-medium">{user.first_name} {user.last_name}</p>
                                        <p className="text-xs leading-none text-muted">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                            <Dropdown.Menu onAction={(key) => console.log(`Selected: ${key}`)}>
                                <Dropdown.Section/>
                                <Dropdown.Item id="Dashboard" textValue="Dashboard">
                                    <Link href={"/dashboard/"}
                                          className={"w-full flex justify-between items-center"}>
                                        <Label>Dashboard</Label>
                                        <Icon icon={LayoutDashboard}/>
                                    </Link>
                                </Dropdown.Item>
                                <Dropdown.Item id="Account" textValue="Account">
                                    <Link href={"/dashboard/account"}
                                          className={"w-full flex justify-between items-center"}>
                                        <Label>Account</Label>
                                        <Icon icon={UserRound}/>
                                    </Link>
                                </Dropdown.Item>
                                <Dropdown.Item id="Orders" textValue="Orders">
                                    <Link href={"/dashboard/orders"}
                                          className={"w-full flex justify-between items-center"}>
                                        <Label>Orders</Label>
                                        <Icon icon={ClipboardList}/>
                                    </Link>
                                </Dropdown.Item>
                                <Dropdown.Item id="Addresses" textValue="Addresses">
                                    <Link href={"/dashboard/addresses"}
                                          className={"w-full flex justify-between items-center"}>
                                        <Label>Addresses</Label>
                                        <Icon icon={MapPinHouse}/>
                                    </Link>
                                </Dropdown.Item>
                                <Separator/>
                                <Dropdown.Item id="Logout" textValue="Log Out"
                                               onClick={handleLogout}>
                                    <div
                                        className={"w-full flex justify-between items-center text-danger"}>
                                        <Label className={"text-danger"}>Logout</Label>
                                        <Icon icon={LogOut}/>
                                    </div>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown> :
                    <Button isIconOnly variant="ghost" onPress={() => router.push("/login")}>
                        <Icon icon={UserRound}/>
                    </Button>}

                <Link href={"/cart"}>
                    <Button isIconOnly variant={"ghost"}>
                        <Icon icon={ShoppingCart}/>
                        {totalQuantity > 0 && (<div
                            className="absolute -right-1 -top-1 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-foreground ring-2 ring-background">
                            <Typography
                                type="small"
                                className="text-background"
                            >
                                {totalQuantity}
                            </Typography>
                        </div>)}
                    </Button>
                </Link>


                <Button isIconOnly variant={"ghost"} onPress={() => toggleTheme()}>
                    {theme === 'dark' ? <Icon icon={Sun}/> : <Icon icon={Moon}/>}

                </Button>
            </div>
        </div>

        <Drawer.Backdrop isOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
            <Drawer.Content placement="left">
                <Drawer.Dialog>
                    <Drawer.Header className={"border-b-2 border-foreground"}>
                        <Drawer.Heading
                            className={"font-atomic text-center font-bold text-2xl uppercase pb-2"}>
                            fog direct
                        </Drawer.Heading>
                    </Drawer.Header>
                    <Drawer.Body>
                        <ul className={"list-none flex flex-col gap-2"}>
                            {navigation.map((i, x) => (<li key={x}
                                                           className={"w-full flex justify-between items-center p-2 px-4 border-b"}>
                                <Link href={i.href} className={"nav-link"}>
                                    {i.title}
                                </Link>
                            </li>))}
                        </ul>
                    </Drawer.Body>
                    <Drawer.Footer>
                    </Drawer.Footer>
                </Drawer.Dialog>
            </Drawer.Content>
        </Drawer.Backdrop>
    </header>
}

export default Navbar