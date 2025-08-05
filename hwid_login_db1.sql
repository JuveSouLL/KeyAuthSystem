-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1
-- Üretim Zamanı: 04 Ağu 2025, 17:54:34
-- Sunucu sürümü: 10.4.32-MariaDB
-- PHP Sürümü: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `hwid_login_db1`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `kontrol`
--

CREATE TABLE `kontrol` (
  `id` int(11) NOT NULL,
  `kullaniciadi` varchar(255) DEFAULT NULL,
  `log` text DEFAULT NULL,
  `tarih_saat` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `kontrol`
--

INSERT INTO `kontrol` (`id`, `kullaniciadi`, `log`, `tarih_saat`) VALUES
(1, 'Edit2', 'Edit3', '2024-11-28 14:30:00'),
(2, 'Edit2', 'Edit3', '2024-11-28 14:30:00'),
(3, 'Edit2', 'Edit3', '2024-11-28 14:30:00');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `sn`
--

CREATE TABLE `sn` (
  `id` int(11) NOT NULL,
  `key` varchar(255) NOT NULL,
  `hwid` varchar(255) DEFAULT NULL,
  `remaining_time` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `sn`
--

INSERT INTO `sn` (`id`, `key`, `hwid`, `remaining_time`) VALUES
(1, 'asd', '', 22123);

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `kontrol`
--
ALTER TABLE `kontrol`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `sn`
--
ALTER TABLE `sn`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `kontrol`
--
ALTER TABLE `kontrol`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Tablo için AUTO_INCREMENT değeri `sn`
--
ALTER TABLE `sn`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

DELIMITER $$
--
-- Olaylar
--
CREATE DEFINER=`root`@`localhost` EVENT `decrease_remaining_time_every_second` ON SCHEDULE EVERY 60 MINUTE STARTS '2024-09-06 20:29:29' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE sn 
  SET remaining_time = remaining_time - 1
  WHERE remaining_time > 0 AND hwid IS NOT NULL AND hwid != ''$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
